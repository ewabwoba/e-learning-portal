package com.coursely.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "payments")
public class Payment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "student_id") private User student;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "course_id") private Course course;

    @Column(nullable = false) private int amountKes;                 // STK Push only accepts whole shillings
    @Column(nullable = false, length = 12) private String phone;     // 2547XXXXXXXX
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private PaymentStatus status = PaymentStatus.PENDING;

    private String merchantRequestId;
    @Column(unique = true) private String checkoutRequestId;         // how the callback finds this row
    private String mpesaReceipt;                                     // e.g. QGH7XXXXXX, set on success
    private Integer resultCode;
    @Column(length = 255) private String resultDesc;

    @Column(nullable = false) private Instant createdAt = Instant.now();
    @Column(nullable = false) private Instant updatedAt = Instant.now();

    protected Payment() {}
    public Payment(User student, Course course, int amountKes, String phone) {
        this.student = student; this.course = course; this.amountKes = amountKes; this.phone = phone;
    }

    public Long getId() { return id; }
    public User getStudent() { return student; }
    public Course getCourse() { return course; }
    public int getAmountKes() { return amountKes; }
    public String getPhone() { return phone; }
    public PaymentStatus getStatus() { return status; } public void setStatus(PaymentStatus v) { status = v; updatedAt = Instant.now(); }
    public String getMerchantRequestId() { return merchantRequestId; } public void setMerchantRequestId(String v) { merchantRequestId = v; }
    public String getCheckoutRequestId() { return checkoutRequestId; } public void setCheckoutRequestId(String v) { checkoutRequestId = v; }
    public String getMpesaReceipt() { return mpesaReceipt; } public void setMpesaReceipt(String v) { mpesaReceipt = v; }
    public Integer getResultCode() { return resultCode; } public void setResultCode(Integer v) { resultCode = v; }
    public String getResultDesc() { return resultDesc; } public void setResultDesc(String v) { resultDesc = v == null ? null : v.substring(0, Math.min(255, v.length())); }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}