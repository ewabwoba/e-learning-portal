package com.coursely.service;

import com.coursely.dto.Api.*;
import com.coursely.model.*;
import com.coursely.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class InstructorService {
    private final CourseRepository courses;
    private final EnrollmentRepository enrollments;
    private final LessonProgressRepository progress;
    private final UserRepository users;
    private final CategoryRepository categories;
    private final AuditService audit;
    private final CourseMapper mapper;

    public InstructorService(CourseRepository courses, EnrollmentRepository enrollments, LessonProgressRepository progress, UserRepository users,
                             CategoryRepository categories, AuditService audit, CourseMapper mapper) {
        this.courses = courses; this.enrollments = enrollments; this.progress = progress; this.users = users;
        this.categories = categories; this.audit = audit; this.mapper = mapper;
    }

    /** Loads a course and enforces ownership (admins may open any course). Other instructors' courses look like they do not exist. */
    Course owned(User me, Long id) {
        return courses.findById(id).filter(c -> me.getRole() == Role.ADMIN || c.getInstructor().getId().equals(me.getId()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "We could not find that course."));
    }

    public List<CourseView> myCourses(User me) {
        return courses.findByInstructorIdOrderByCreatedAtDesc(me.getId()).stream().map(mapper::withRevenue).toList();
    }

    public CourseView get(User me, Long id) { return mapper.editorDetail(owned(me, id)); }

    @Transactional
    public CourseView save(User me, Long id, CourseRequest r) {
        Course c;
        if (id == null) { c = new Course(users.getReferenceById(me.getId())); c.setBadge("NEW"); }
        else c = owned(me, id);
        if (r.originalPrice() != null && r.originalPrice().compareTo(r.price()) < 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Original price must be higher than the sale price.");
        Category cat = categories.findByNameIgnoreCase(r.category().trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose one of the available categories."));
        c.setTitle(r.title().trim()); c.setCategory(cat.getName()); c.setLevel(r.level()); c.setDescription(r.description().trim());
        c.setPrice(r.price()); c.setOriginalPrice(r.originalPrice()); c.setImageUrl(r.imageUrl() == null ? "" : r.imageUrl().trim());
        applyCurriculum(c, r.modules() == null ? List.of() : r.modules());
        Course saved = courses.save(c);
        if (me.getRole() == Role.ADMIN) audit.log(me, "COURSE_EDITED", "COURSE", saved.getId(), "Edited by admin: " + saved.getTitle());
        return mapper.editorDetail(saved);
    }

    /** Diff by id: known ids are updated in place, unknown/new rows are created, omitted rows are removed (with their progress). */
    private void applyCurriculum(Course c, List<ModuleRequest> reqs) {
        Map<Long, CourseModule> existing = c.getModules().stream().filter(m -> m.getId() != null).collect(Collectors.toMap(CourseModule::getId, m -> m));
        Set<Long> before = c.getModules().stream().flatMap(m -> m.getLessons().stream()).map(Lesson::getId).collect(Collectors.toSet());
        Set<Long> kept = new HashSet<>();
        List<CourseModule> result = new ArrayList<>();
        int mp = 0;
        for (ModuleRequest mr : reqs) {
            CourseModule m = mr.id() != null && existing.containsKey(mr.id()) ? existing.get(mr.id()) : new CourseModule(c);
            m.setTitle(mr.title().trim()); m.setPosition(mp++);
            Map<Long, Lesson> le = m.getLessons().stream().filter(l -> l.getId() != null).collect(Collectors.toMap(Lesson::getId, l -> l));
            List<Lesson> ls = new ArrayList<>();
            int lp = 0;
            for (LessonRequest lr : mr.lessons() == null ? List.<LessonRequest>of() : mr.lessons()) {
                Lesson l = lr.id() != null && le.containsKey(lr.id()) ? le.get(lr.id()) : new Lesson(m);
                if (l.getId() != null) kept.add(l.getId());
                l.setTitle(lr.title().trim()); l.setPosition(lp++);
                l.setType("READING".equalsIgnoreCase(lr.type()) ? LessonType.READING : LessonType.VIDEO);
                l.setDurationMinutes(lr.durationMinutes() == null ? 0 : lr.durationMinutes());
                l.setContent(lr.content());
                ls.add(l);
            }
            m.getLessons().clear(); m.getLessons().addAll(ls);
            result.add(m);
        }
        Set<Long> removed = new HashSet<>(before); removed.removeAll(kept);
        if (!removed.isEmpty()) progress.deleteByLessonIds(removed); // avoid FK violations when lessons are deleted
        c.getModules().clear(); c.getModules().addAll(result);
    }

    /**
     * Instructor-driven lifecycle. Instructors never publish directly: they submit for review and an admin approves.
     *   DRAFT / REJECTED -> PENDING_REVIEW (needs an approved instructor account and at least one lesson)
     *   PENDING_REVIEW / ARCHIVED -> DRAFT   (withdraw / restore)
     *   DRAFT / REJECTED / PUBLISHED -> ARCHIVED
     */
    @Transactional
    public CourseView setStatus(User me, Long id, String status) {
        Course c = owned(me, id);
        CourseStatus to;
        try { to = CourseStatus.valueOf(status.toUpperCase()); } catch (IllegalArgumentException e) { throw bad("Unknown status."); }
        CourseStatus from = c.getStatus();
        switch (to) {
            case PENDING_REVIEW -> {
                if (from != CourseStatus.DRAFT && from != CourseStatus.REJECTED) throw conflict(from);
                if (me.getApproval() != ApprovalStatus.APPROVED)
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your instructor account is awaiting approval. You can keep drafting, but you cannot submit courses yet.");
                if (c.getModules().stream().mapToInt(m -> m.getLessons().size()).sum() == 0)
                    throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Add at least one lesson before submitting for review.");
                c.setRejectionReason(null);
            }
            case DRAFT -> { if (from != CourseStatus.PENDING_REVIEW && from != CourseStatus.ARCHIVED) throw conflict(from); }
            case ARCHIVED -> { if (from != CourseStatus.DRAFT && from != CourseStatus.REJECTED && from != CourseStatus.PUBLISHED) throw conflict(from); }
            default -> throw bad("Instructors cannot set that status. Submit the course for review instead.");
        }
        c.setStatus(to);
        return mapper.summary(c);
    }

    private static ResponseStatusException bad(String m) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, m); }
    private static ResponseStatusException conflict(CourseStatus from) {
        return new ResponseStatusException(HttpStatus.CONFLICT, "That change is not available while the course is " + from.name().toLowerCase().replace('_', ' ') + ".");
    }

    public List<StudentRow> students(User me) {
        return enrollments.findByCourseInstructorIdOrderByEnrolledAtDesc(me.getId()).stream().map(e -> {
            int total = (int) e.getCourse().getModules().stream().mapToLong(m -> m.getLessons().size()).sum();
            int done = progress.findByEnrollment(e.getId()).size();
            return new StudentRow(e.getId(), e.getStudent().getId(), e.getStudent().getName(), e.getStudent().getEmail(), e.getCourse().getId(),
                e.getCourse().getTitle(), total == 0 ? 0 : Math.round(done * 100f / total), e.getEnrolledAt());
        }).toList();
    }

    public InstructorStats stats(User me) {
        List<Course> mine = courses.findByInstructorIdOrderByCreatedAtDesc(me.getId());
        List<CourseSales> rows = mine.stream().map(c -> new CourseSales(c.getId(), c.getTitle(), mapper.students(c), c.getPrice().multiply(BigDecimal.valueOf(mapper.students(c))))).toList();
        List<Course> rated = mine.stream().filter(c -> c.getStatus() == CourseStatus.PUBLISHED && c.getRatingCount() > 0).toList();
        double avg = rated.isEmpty() ? 0 : Math.round(rated.stream().mapToDouble(Course::getRating).average().orElse(0) * 10) / 10.0;
        return new InstructorStats(mine.size(), (int) mine.stream().filter(c -> c.getStatus() == CourseStatus.PUBLISHED).count(),
            rows.stream().mapToLong(CourseSales::students).sum(), rows.stream().map(CourseSales::revenue).reduce(BigDecimal.ZERO, BigDecimal::add), avg,
            rows.stream().filter(r -> r.students() > 0).sorted(Comparator.comparingLong(CourseSales::students).reversed()).limit(6).toList());
    }
}
