package com.coursely.repository;

import com.coursely.model.Course;
import com.coursely.model.CourseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByStatusOrderByCreatedAtDesc(CourseStatus status);
    List<Course> findByInstructorIdOrderByCreatedAtDesc(Long instructorId);
    long countByInstructorId(Long instructorId);
    long countByStatus(CourseStatus status);
    long countByCategoryIgnoreCase(String category);
    List<Course> findAllByOrderByCreatedAtDesc();

    @Modifying
    @Query("update Course c set c.category = :to where lower(c.category) = lower(:from)")
    int renameCategory(@Param("from") String from, @Param("to") String to);
}
