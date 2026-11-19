package com.coursely.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Request and response shapes of the REST API. Entities are never serialised directly. */
public final class Api {
    private Api() {}

    // ---- requests ----
    public record RegisterRequest(@NotBlank @Size(max = 120) String name, @NotBlank @Email @Size(max = 190) String email,
                                  @NotBlank @Size(min = 8, max = 100) String password, String role) {}
    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}
    public record ProfileRequest(@NotBlank @Size(max = 120) String name, @Size(max = 120) String headline) {}
    public record EnrollRequest(@NotNull Long courseId) {}
    public record StatusRequest(@NotBlank String status) {}
    public record LessonRequest(Long id, @NotBlank @Size(max = 180) String title, String type,
                                @PositiveOrZero Integer durationMinutes, @Size(max = 4000) String content) {}
    public record ModuleRequest(Long id, @NotBlank @Size(max = 180) String title, @Valid List<LessonRequest> lessons) {}
    public record CourseRequest(@NotBlank @Size(max = 180) String title, @NotBlank @Size(max = 80) String category,
                                @NotBlank @Size(max = 30) String level, @NotBlank @Size(min = 20, max = 2000) String description,
                                @NotNull @DecimalMin("0.00") BigDecimal price, @DecimalMin("0.00") BigDecimal originalPrice,
                                @Size(max = 500) String imageUrl, @Valid List<ModuleRequest> modules) {}

    // ---- responses ----
    public record UserView(Long id, String name, String email, String role, String headline) {}
    public record AuthResponse(String token, UserView user) {}
    public record InstructorView(Long id, String name, String headline) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record LessonView(Long id, String title, String type, int durationMinutes, String content, Boolean completed) {}
    public record ModuleView(Long id, String title, List<LessonView> lessons) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record CourseView(Long id, String title, String category, String level, String description, BigDecimal price,
                             BigDecimal originalPrice, String imageUrl, String badge, double rating, int ratingCount, long students,
                             String status, Instant createdAt, int durationMinutes, int lessonCount, InstructorView instructor,
                             BigDecimal revenue, List<ModuleView> modules, Integer progressPercent, Integer completedLessons,
                             Integer totalLessons, Boolean preview) {}

    public record EnrollmentView(Long id, Long courseId, CourseView course, Instant enrolledAt, Instant lastActivityAt,
                                 int completedLessons, int totalLessons, int progressPercent, Long nextLessonId) {}
    public record ToggleResult(Long lessonId, boolean completed, int progressPercent, int completedLessons, int totalLessons) {}
    public record DayMinutes(String label, int minutes) {}
    public record LearnerStats(int inProgress, int completed, int certificates, int minutesLearned, int streakDays, List<DayMinutes> weekly) {}
    public record CourseSales(Long courseId, String title, long students, BigDecimal revenue) {}
    public record InstructorStats(int courses, int published, long students, BigDecimal revenue, double averageRating, List<CourseSales> byCourse) {}
    public record StudentRow(Long enrollmentId, Long studentId, String name, String email, Long courseId, String courseTitle,
                             int progressPercent, Instant enrolledAt) {}
}
