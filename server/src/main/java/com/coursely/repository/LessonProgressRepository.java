package com.coursely.repository;

import com.coursely.model.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {
    @Query("select p from LessonProgress p join fetch p.lesson where p.enrollment.id = :enrollmentId")
    List<LessonProgress> findByEnrollment(@Param("enrollmentId") Long enrollmentId);

    @Query("select p from LessonProgress p join fetch p.lesson join p.enrollment e where e.student.id = :studentId")
    List<LessonProgress> findByStudent(@Param("studentId") Long studentId);

    Optional<LessonProgress> findByEnrollmentIdAndLessonId(Long enrollmentId, Long lessonId);

    @Modifying
    @Query("delete from LessonProgress p where p.lesson.id in :lessonIds")
    void deleteByLessonIds(@Param("lessonIds") Collection<Long> lessonIds);
}
