package com.coursely.service;

import com.coursely.dto.Api.CourseView;
import com.coursely.model.Course;
import com.coursely.model.CourseStatus;
import com.coursely.model.User;
import com.coursely.repository.CourseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class CourseService {
    private final CourseRepository courses;
    private final CourseMapper mapper;
    public CourseService(CourseRepository courses, CourseMapper mapper) { this.courses = courses; this.mapper = mapper; }

    public List<CourseView> published() {
        return courses.findByStatusOrderByCreatedAtDesc(CourseStatus.PUBLISHED).stream().map(mapper::summary).toList();
    }

    /** Drafts are visible only to their instructor. `viewer` may be null (anonymous). */
    public CourseView get(Long id, User viewer) {
        Course c = courses.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "We could not find that course."));
        boolean owner = viewer != null && c.getInstructor().getId().equals(viewer.getId());
        if (c.getStatus() != CourseStatus.PUBLISHED && !owner) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "We could not find that course.");
        return mapper.publicDetail(c);
    }
}
