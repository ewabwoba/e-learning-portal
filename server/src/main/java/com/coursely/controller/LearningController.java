package com.coursely.controller;

import com.coursely.dto.Api.*;
import com.coursely.model.User;
import com.coursely.service.LearningService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api")
public class LearningController {
    private final LearningService learning;
    public LearningController(LearningService learning) { this.learning = learning; }

    @GetMapping("/enrollments/me") public List<EnrollmentView> mine(@AuthenticationPrincipal User u) { return learning.myEnrollments(u); }
    @PostMapping("/enrollments") @ResponseStatus(HttpStatus.CREATED)
    public EnrollmentView enroll(@AuthenticationPrincipal User u, @Valid @RequestBody EnrollRequest r) { return learning.enroll(u, r.courseId()); }
    @GetMapping("/learn/courses/{id}") public CourseView course(@AuthenticationPrincipal User u, @PathVariable Long id) { return learning.learn(u, id); }
    @PostMapping("/learn/courses/{courseId}/lessons/{lessonId}/toggle")
    public ToggleResult toggle(@AuthenticationPrincipal User u, @PathVariable Long courseId, @PathVariable Long lessonId) { return learning.toggle(u, courseId, lessonId); }
    @GetMapping("/learn/stats") public LearnerStats stats(@AuthenticationPrincipal User u) { return learning.stats(u); }
}
