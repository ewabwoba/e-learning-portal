package com.coursely.service;

import com.coursely.dto.Api.PaymentView;
import com.coursely.model.*;
import com.coursely.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;

@Service
public class PaymentService {
    private final PaymentRepository payments;
    private final CourseRepository courses;
    private final EnrollmentRepository enrollments;
    private final UserRepository users;
    private final MpesaClient mpesa;

    public PaymentService(PaymentRepository payments, CourseRepository courses, EnrollmentRepository enrollments, UserRepository users, MpesaClient mpesa) {
        this.payments = payments; this.courses = courses; this.enrollments = enrollments; this.users = users; this.mpesa = mpesa;
    }

    private static ResponseStatusException err(HttpStatus s, String m) { return new ResponseStatusException(s, m); }

    private static PaymentView view(Payment p, Long courseId) {
        String msg = switch (p.getStatus()) {
            case PENDING -> "Check your phone and enter your M-Pesa PIN.";
            case SUCCESS -> "Payment received. You are enrolled.";
            case CANCELLED -> "You cancelled the request.";
            case FAILED -> p.getResultDesc() != null ? p.getResultDesc() : "The payment failed.";
        };
        return new PaymentView(p.getId(), courseId, p.getStatus().name(), p.getAmountKes(), msg, p.getMpesaReceipt());
    }

    /** Not @Transactional on purpose: the PENDING row must be saved even if Daraja then fails. */
    public PaymentView start(User me, Long courseId, String rawPhone) {
        Course c = courses.findById(courseId).filter(x -> x.getStatus() == CourseStatus.PUBLISHED)
            .orElseThrow(() -> err(HttpStatus.NOT_FOUND, "We could not find that course."));
        if (enrollments.findByStudentIdAndCourseId(me.getId(), courseId).isPresent()) throw err(HttpStatus.CONFLICT, "You are already enrolled in this course.");
        if (c.getPrice().signum() <= 0) throw err(HttpStatus.BAD_REQUEST, "This course is free. Enrol directly.");
        String phone = MpesaClient.normalizePhone(rawPhone);
        if (phone == null) throw err(HttpStatus.BAD_REQUEST, "Enter a valid Safaricom number, e.g. 0712 345 678.");

        // Double-click guard: reuse a request sent in the last 90 seconds instead of prompting the phone twice.
        Instant cutoff = Instant.now().minus(Duration.ofSeconds(90));
        var recent = payments.findByStudentIdAndCourseIdAndStatus(me.getId(), courseId, PaymentStatus.PENDING).stream()
            .filter(p -> p.getCreatedAt().isAfter(cutoff)).findFirst();
        if (recent.isPresent()) return view(recent.get(), courseId);

        int amount = c.getPrice().setScale(0, RoundingMode.CEILING).intValueExact(); // price is treated as KES
        Payment p = payments.save(new Payment(users.getReferenceById(me.getId()), c, amount, phone));
        try {
            MpesaClient.StkResult r = mpesa.stkPush(phone, amount, "COURSE" + c.getId(), "Course fee");
            p.setMerchantRequestId(r.merchantRequestId());
            p.setCheckoutRequestId(r.checkoutRequestId());
            payments.save(p);
            return view(p, courseId);
        } catch (ResponseStatusException e) {
            p.setStatus(PaymentStatus.FAILED);
            p.setResultDesc(e.getReason());
            payments.save(p);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public PaymentView status(User me, Long id) {
        Payment p = payments.findByIdAndStudentId(id, me.getId()).orElseThrow(() -> err(HttpStatus.NOT_FOUND, "We could not find that payment."));
        return view(p, p.getCourse().getId());
    }

    /** The ONLY place a paid enrolment is created. Safe to receive twice: settled payments are ignored. */
    @Transactional
    public void handleCallback(JsonNode body) {
        JsonNode cb = body.path("Body").path("stkCallback");
        String checkoutId = cb.path("CheckoutRequestID").asText(null);
        if (checkoutId == null) return;
        Payment p = payments.findByCheckoutRequestId(checkoutId).orElse(null);
        if (p == null || p.getStatus() != PaymentStatus.PENDING) return;

        int code = cb.path("ResultCode").asInt(-1);
        p.setResultCode(code);
        p.setResultDesc(cb.path("ResultDesc").asText(""));
        if (code == 0) {
            String receipt = null; double paid = 0;
            for (JsonNode item : cb.path("CallbackMetadata").path("Item")) {
                switch (item.path("Name").asText()) {
                    case "MpesaReceiptNumber" -> receipt = item.path("Value").asText(null);
                    case "Amount" -> paid = item.path("Value").asDouble(0);
                    default -> { }
                }
            }
            if (paid < p.getAmountKes()) { p.setStatus(PaymentStatus.FAILED); p.setResultDesc("Amount paid did not match the course price."); }
            else {
                p.setMpesaReceipt(receipt);
                p.setStatus(PaymentStatus.SUCCESS);
                if (enrollments.findByStudentIdAndCourseId(p.getStudent().getId(), p.getCourse().getId()).isEmpty())
                    enrollments.save(new Enrollment(p.getStudent(), p.getCourse()));
            }
        } else {
            p.setStatus(code == 1032 ? PaymentStatus.CANCELLED : PaymentStatus.FAILED); // 1032 = customer cancelled
        }
        payments.save(p);
    }
}