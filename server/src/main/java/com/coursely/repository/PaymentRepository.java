package com.coursely.repository;

import com.coursely.model.Payment;
import com.coursely.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByCheckoutRequestId(String checkoutRequestId);
    Optional<Payment> findByIdAndStudentId(Long id, Long studentId);
    boolean existsByStudentIdAndCourseIdAndStatus(Long studentId, Long courseId, PaymentStatus status);
    List<Payment> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<Payment> findByStudentIdAndCourseIdAndStatus(Long studentId, Long courseId, PaymentStatus status);
}