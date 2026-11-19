package com.coursely.controller;

import com.coursely.dto.Api.*;
import com.coursely.model.User;
import com.coursely.service.InstructorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/instructor")
public class InstructorController {
    private final InstructorService service;
    public InstructorController(InstructorService service) { this.service = service; }

    @GetMapping("/courses") public List<CourseView> courses(@AuthenticationPrincipal User u) { return service.myCourses(u); }
    @GetMapping("/courses/{id}") public CourseView course(@AuthenticationPrincipal User u, @PathVariable Long id) { return service.get(u, id); }
    @PostMapping("/courses") @ResponseStatus(HttpStatus.CREATED)
    public CourseView create(@AuthenticationPrincipal User u, @Valid @RequestBody CourseRequest r) { return service.save(u, null, r); }
    @PutMapping("/courses/{id}")
    public CourseView update(@AuthenticationPrincipal User u, @PathVariable Long id, @Valid @RequestBody CourseRequest r) { return service.save(u, id, r); }
    @PatchMapping("/courses/{id}/status")
    public CourseView status(@AuthenticationPrincipal User u, @PathVariable Long id, @Valid @RequestBody StatusRequest r) { return service.setStatus(u, id, r.status()); }
    @GetMapping("/students") public List<StudentRow> students(@AuthenticationPrincipal User u) { return service.students(u); }
    @GetMapping("/stats") public InstructorStats stats(@AuthenticationPrincipal User u) { return service.stats(u); }
}
