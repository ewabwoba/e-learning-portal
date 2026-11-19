package com.coursely.repository;

import com.coursely.model.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudentIdOrderByEnrolledAtDesc(Long studentId);
    Optional<Enrollment> findByStudentIdAndCourseId(Long studentId, Long courseId);
    List<Enrollment> findByCourseInstructorIdOrderByEnrolledAtDesc(Long instructorId);
    long countByCourseId(Long courseId);
}
