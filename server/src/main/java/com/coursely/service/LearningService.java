package com.coursely.service;

import com.coursely.dto.Api.*;
import com.coursely.model.*;
import com.coursely.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class LearningService {
    private final CourseRepository courses;
    private final EnrollmentRepository enrollments;
    private final LessonProgressRepository progress;
    private final UserRepository users;
    private final CourseMapper mapper;

    public LearningService(CourseRepository courses, EnrollmentRepository enrollments, LessonProgressRepository progress, UserRepository users, CourseMapper mapper) {
        this.courses = courses; this.enrollments = enrollments; this.progress = progress; this.users = users; this.mapper = mapper;
    }

    private static ResponseStatusException notFound() { return new ResponseStatusException(HttpStatus.NOT_FOUND, "We could not find that course."); }

    private static List<Lesson> lessons(Course c) { return c.getModules().stream().flatMap(m -> m.getLessons().stream()).toList(); }

    private EnrollmentView view(Enrollment e) {
        List<Lesson> all = lessons(e.getCourse());
        List<LessonProgress> done = progress.findByEnrollment(e.getId());
        Set<Long> doneIds = done.stream().map(p -> p.getLesson().getId()).collect(Collectors.toSet());
        Instant last = done.stream().map(LessonProgress::getCompletedAt).max(Comparator.naturalOrder()).orElse(e.getEnrolledAt());
        Long next = all.stream().filter(l -> !doneIds.contains(l.getId())).map(Lesson::getId).findFirst().orElse(null);
        int pct = all.isEmpty() ? 0 : Math.round(doneIds.size() * 100f / all.size());
        return new EnrollmentView(e.getId(), e.getCourse().getId(), mapper.summary(e.getCourse()), e.getEnrolledAt(), last, doneIds.size(), all.size(), pct, next);
    }

    public List<EnrollmentView> myEnrollments(User me) {
        return enrollments.findByStudentIdOrderByEnrolledAtDesc(me.getId()).stream().map(this::view)
            .sorted(Comparator.comparing(EnrollmentView::lastActivityAt).reversed()).toList();
    }

    @Transactional
    public EnrollmentView enroll(User me, Long courseId) {
        Course c = courses.findById(courseId).filter(x -> x.getStatus() == CourseStatus.PUBLISHED).orElseThrow(LearningService::notFound);
        Enrollment e = enrollments.findByStudentIdAndCourseId(me.getId(), courseId)
            .orElseGet(() -> enrollments.save(new Enrollment(users.getReferenceById(me.getId()), c)));
        return view(e);
    }

    public CourseView learn(User me, Long courseId) {
        Course c = courses.findById(courseId).orElseThrow(LearningService::notFound);
        Optional<Enrollment> e = enrollments.findByStudentIdAndCourseId(me.getId(), courseId);
        boolean owner = c.getInstructor().getId().equals(me.getId());
        if (e.isEmpty() && !owner) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Enroll in this course to start learning.");
        Set<Long> done = e.map(x -> progress.findByEnrollment(x.getId()).stream().map(p -> p.getLesson().getId()).collect(Collectors.toSet())).orElse(Set.of());
        return mapper.learnerDetail(c, done, e.isEmpty());
    }

    @Transactional
    public ToggleResult toggle(User me, Long courseId, Long lessonId) {
        Enrollment e = enrollments.findByStudentIdAndCourseId(me.getId(), courseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Enroll in this course first."));
        Lesson lesson = lessons(e.getCourse()).stream().filter(l -> l.getId().equals(lessonId)).findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "We could not find that lesson."));
        Optional<LessonProgress> existing = progress.findByEnrollmentIdAndLessonId(e.getId(), lessonId);
        boolean completed;
        if (existing.isPresent()) { progress.delete(existing.get()); completed = false; }
        else { progress.save(new LessonProgress(e, lesson)); completed = true; }
        progress.flush();
        EnrollmentView v = view(e);
        return new ToggleResult(lessonId, completed, v.progressPercent(), v.completedLessons(), v.totalLessons());
    }

    public LearnerStats stats(User me) {
        List<EnrollmentView> views = enrollments.findByStudentIdOrderByEnrolledAtDesc(me.getId()).stream().map(this::view).toList();
        List<LessonProgress> done = progress.findByStudent(me.getId());
        int completed = (int) views.stream().filter(v -> v.progressPercent() == 100).count();
        int minutes = done.stream().mapToInt(p -> p.getLesson().getDurationMinutes()).sum();
        Set<LocalDate> days = done.stream().map(p -> p.getCompletedAt().atZone(ZoneOffset.UTC).toLocalDate()).collect(Collectors.toSet());
        return new LearnerStats(views.size() - completed, completed, completed, minutes, streak(days, LocalDate.now(ZoneOffset.UTC)), weekly(done, LocalDate.now(ZoneOffset.UTC)));
    }

    /** Consecutive active days ending today (or yesterday, so the streak survives until midnight). */
    static int streak(Set<LocalDate> days, LocalDate today) {
        LocalDate cursor = days.contains(today) ? today : today.minusDays(1);
        int n = 0;
        while (days.contains(cursor)) { n++; cursor = cursor.minusDays(1); }
        return n;
    }

    static List<DayMinutes> weekly(List<LessonProgress> done, LocalDate today) {
        List<DayMinutes> out = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            int m = done.stream().filter(p -> p.getCompletedAt().atZone(ZoneOffset.UTC).toLocalDate().equals(d)).mapToInt(p -> p.getLesson().getDurationMinutes()).sum();
            out.add(new DayMinutes(d.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH), m));
        }
        return out;
    }
}
