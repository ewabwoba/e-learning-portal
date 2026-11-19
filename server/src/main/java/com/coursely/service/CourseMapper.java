package com.coursely.service;

import com.coursely.dto.Api.*;
import com.coursely.model.*;
import com.coursely.repository.EnrollmentRepository;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

/** Entity to DTO mapping. Call inside a transaction: it touches lazy associations. */
@Component
public class CourseMapper {
    private final EnrollmentRepository enrollments;
    public CourseMapper(EnrollmentRepository enrollments) { this.enrollments = enrollments; }

    public long students(Course c) { return c.getStudentsBase() + enrollments.countByCourseId(c.getId()); }

    public CourseView summary(Course c) { return build(c, null, null, null, null, null, null); }

    public CourseView withRevenue(Course c) {
        return build(c, c.getPrice().multiply(BigDecimal.valueOf(students(c))), null, null, null, null, null);
    }

    /** Public curriculum: lesson titles and durations only, never lesson content. */
    public CourseView publicDetail(Course c) { return build(c, null, modules(c, false, null), null, null, null, null); }

    /** Full curriculum for the instructor editor. */
    public CourseView editorDetail(Course c) { return build(c, null, modules(c, true, null), null, null, null, null); }

    /** Learner view with content and per-lesson completion. */
    public CourseView learnerDetail(Course c, Set<Long> completed, boolean preview) {
        List<ModuleView> mods = modules(c, true, completed);
        int total = mods.stream().mapToInt(m -> m.lessons().size()).sum();
        int done = (int) mods.stream().flatMap(m -> m.lessons().stream()).filter(l -> Boolean.TRUE.equals(l.completed())).count();
        return build(c, null, mods, total == 0 ? 0 : Math.round(done * 100f / total), done, total, preview);
    }

    private List<ModuleView> modules(Course c, boolean content, Set<Long> completed) {
        return c.getModules().stream().map(m -> new ModuleView(m.getId(), m.getTitle(), m.getLessons().stream()
            .map(l -> new LessonView(l.getId(), l.getTitle(), l.getType().name(), l.getDurationMinutes(), content ? l.getContent() : null,
                completed == null ? null : completed.contains(l.getId()))).toList())).toList();
    }

    private CourseView build(Course c, BigDecimal revenue, List<ModuleView> modules, Integer pct, Integer done, Integer total, Boolean preview) {
        int minutes = 0, lessons = 0;
        for (CourseModule m : c.getModules()) for (Lesson l : m.getLessons()) { lessons++; minutes += l.getDurationMinutes(); }
        User i = c.getInstructor();
        return new CourseView(c.getId(), c.getTitle(), c.getCategory(), c.getLevel(), c.getDescription(), c.getPrice(), c.getOriginalPrice(),
            c.getImageUrl(), c.getBadge(), c.getRating(), c.getRatingCount(), students(c), c.getStatus().name(), c.getCreatedAt(), minutes, lessons,
            new InstructorView(i.getId(), i.getName(), i.getHeadline()), revenue, modules, pct, done, total, preview);
    }
}
