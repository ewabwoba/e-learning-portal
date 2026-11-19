package com.coursely.repository;

import com.coursely.model.Course;
import com.coursely.model.CourseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByStatusOrderByCreatedAtDesc(CourseStatus status);
    List<Course> findByInstructorIdOrderByCreatedAtDesc(Long instructorId);
}
