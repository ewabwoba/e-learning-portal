package com.coursely.controller;

import com.coursely.dto.Api.*;
import com.coursely.model.User;
import com.coursely.service.AdminService;
import com.coursely.service.InstructorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Administration API. The URL space is locked to ROLE_ADMIN in SecurityConfig, and each method additionally requires the
 * specific permission, so a future role (e.g. a moderator with only REVIEW_COURSES) works without changing this class.
 */
@RestController @RequestMapping("/api/admin")
public class AdminController {
    private final AdminService admin;
    private final InstructorService instructor;
    public AdminController(AdminService admin, InstructorService instructor) { this.admin = admin; this.instructor = instructor; }

    // reports + audit
    @GetMapping("/report") @PreAuthorize("hasAuthority('VIEW_PLATFORM_REPORTS')") public PlatformReport report() { return admin.report(); }
    @GetMapping("/audit") @PreAuthorize("hasAuthority('VIEW_AUDIT_LOG')") public List<AuditView> audit() { return admin.audit(); }

    // users
    @GetMapping("/users") @PreAuthorize("hasAuthority('MANAGE_USERS')") public List<AdminUserView> users() { return admin.listUsers(); }
    @PostMapping("/users") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAuthority('MANAGE_USERS')")
    public AdminUserView createUser(@AuthenticationPrincipal User me, @Valid @RequestBody CreateUserRequest r) { return admin.createUser(me, r); }
    @PutMapping("/users/{id}") @PreAuthorize("hasAuthority('MANAGE_USERS')")
    public AdminUserView updateUser(@AuthenticationPrincipal User me, @PathVariable Long id, @Valid @RequestBody UpdateUserRequest r) { return admin.updateUser(me, id, r); }
    @PatchMapping("/users/{id}/role") @PreAuthorize("hasAuthority('MANAGE_ROLES')")
    public AdminUserView role(@AuthenticationPrincipal User me, @PathVariable Long id, @Valid @RequestBody RoleRequest r) { return admin.changeRole(me, id, r.role()); }
    @PatchMapping("/users/{id}/status") @PreAuthorize("hasAuthority('MANAGE_USERS')")
    public AdminUserView status(@AuthenticationPrincipal User me, @PathVariable Long id, @Valid @RequestBody UserStatusRequest r) { return admin.setUserStatus(me, id, r.status()); }
    @PatchMapping("/users/{id}/approval") @PreAuthorize("hasAuthority('APPROVE_INSTRUCTORS')")
    public AdminUserView approval(@AuthenticationPrincipal User me, @PathVariable Long id, @Valid @RequestBody DecisionRequest r) { return admin.decideInstructor(me, id, r.decision(), r.reason()); }
    @DeleteMapping("/users/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasAuthority('MANAGE_USERS')")
    public void deleteUser(@AuthenticationPrincipal User me, @PathVariable Long id) { admin.deleteUser(me, id); }

    // courses
    @GetMapping("/courses") @PreAuthorize("hasAuthority('REVIEW_COURSES')") public List<CourseView> courses() { return admin.listCourses(); }
    @GetMapping("/courses/{id}") @PreAuthorize("hasAuthority('MANAGE_ANY_COURSE')")
    public CourseView course(@AuthenticationPrincipal User me, @PathVariable Long id) { return instructor.get(me, id); }
    @PutMapping("/courses/{id}") @PreAuthorize("hasAuthority('MANAGE_ANY_COURSE')")
    public CourseView saveCourse(@AuthenticationPrincipal User me, @PathVariable Long id, @Valid @RequestBody CourseRequest r) { return instructor.save(me, id, r); }
    @PatchMapping("/courses/{id}/review") @PreAuthorize("hasAuthority('REVIEW_COURSES')")
    public CourseView review(@AuthenticationPrincipal User me, @PathVariable Long id, @Valid @RequestBody DecisionRequest r) { return admin.reviewCourse(me, id, r.decision(), r.reason()); }
    @PatchMapping("/courses/{id}/badge") @PreAuthorize("hasAuthority('MANAGE_ANY_COURSE')")
    public CourseView badge(@AuthenticationPrincipal User me, @PathVariable Long id, @RequestBody BadgeRequest r) { return admin.setBadge(me, id, r.badge()); }
    @DeleteMapping("/courses/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasAuthority('MANAGE_ANY_COURSE')")
    public void deleteCourse(@AuthenticationPrincipal User me, @PathVariable Long id) { admin.deleteCourse(me, id); }

    // categories
    @GetMapping("/categories") @PreAuthorize("hasAuthority('MANAGE_CATEGORIES')") public List<CategoryView> categories() { return admin.listCategories(); }
    @PostMapping("/categories") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAuthority('MANAGE_CATEGORIES')")
    public CategoryView createCategory(@AuthenticationPrincipal User me, @Valid @RequestBody CategoryRequest r) { return admin.createCategory(me, r.name()); }
    @PutMapping("/categories/{id}") @PreAuthorize("hasAuthority('MANAGE_CATEGORIES')")
    public CategoryView renameCategory(@AuthenticationPrincipal User me, @PathVariable Long id, @Valid @RequestBody CategoryRequest r) { return admin.renameCategory(me, id, r.name()); }
    @DeleteMapping("/categories/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasAuthority('MANAGE_CATEGORIES')")
    public void deleteCategory(@AuthenticationPrincipal User me, @PathVariable Long id) { admin.deleteCategory(me, id); }

    // enrolments
    @GetMapping("/enrollments") @PreAuthorize("hasAuthority('MANAGE_ENROLLMENTS')") public List<AdminEnrollmentView> enrollments() { return admin.listEnrollments(); }
    @PostMapping("/enrollments") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAuthority('MANAGE_ENROLLMENTS')")
    public AdminEnrollmentView enroll(@AuthenticationPrincipal User me, @Valid @RequestBody AdminEnrollRequest r) { return admin.enroll(me, r.studentId(), r.courseId()); }
    @DeleteMapping("/enrollments/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasAuthority('MANAGE_ENROLLMENTS')")
    public void cancel(@AuthenticationPrincipal User me, @PathVariable Long id) { admin.cancelEnrollment(me, id); }
}
