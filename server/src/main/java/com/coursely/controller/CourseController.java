package com.coursely.controller;

import com.coursely.dto.Api.CourseView;
import com.coursely.model.User;
import com.coursely.service.CourseService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/courses")
public class CourseController {
    private final CourseService service;
    public CourseController(CourseService service) { this.service = service; }

    @GetMapping public List<CourseView> list() { return service.published(); }
    @GetMapping("/{id}") public CourseView get(@PathVariable Long id, @AuthenticationPrincipal User viewer) { return service.get(id, viewer); }
}
