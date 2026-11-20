package com.coursely.service;

import com.coursely.dto.Api.*;
import com.coursely.model.*;
import com.coursely.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Platform administration. Every mutating method writes an audit entry in the same transaction.
 * Controllers gate each endpoint with a permission; the rules here protect against self-lockout and orphaned data.
 */
@Service
@Transactional
public class AdminService {
    private static final Set<String> BADGES = Set.of("NEW", "HOT", "FEATURED", "SPECIAL");

    private final UserRepository users;
    private final CourseRepository courses;
    private final EnrollmentRepository enrollments;
    private final LessonProgressRepository progress;
    private final CategoryRepository categories;
    private final AuditLogRepository auditLogs;
    private final AuditService audit;
    private final PasswordEncoder encoder;
    private final CourseMapper mapper;

    public AdminService(UserRepository users, CourseRepository courses, EnrollmentRepository enrollments, LessonProgressRepository progress,
                        CategoryRepository categories, AuditLogRepository auditLogs, AuditService audit, PasswordEncoder encoder, CourseMapper mapper) {
        this.users = users; this.courses = courses; this.enrollments = enrollments; this.progress = progress;
        this.categories = categories; this.auditLogs = auditLogs; this.audit = audit; this.encoder = encoder; this.mapper = mapper;
    }

    private static ResponseStatusException err(HttpStatus s, String m) { return new ResponseStatusException(s, m); }
    private static ResponseStatusException notFound(String what) { return err(HttpStatus.NOT_FOUND, "We could not find that " + what + "."); }

    private User user(Long id) { return users.findById(id).orElseThrow(() -> notFound("user")); }
    private Course course(Long id) { return courses.findById(id).orElseThrow(() -> notFound("course")); }

    private static Role parseRole(String v) {
        try { return Role.valueOf(v.trim().toUpperCase()); } catch (IllegalArgumentException e) { throw err(HttpStatus.BAD_REQUEST, "Role must be STUDENT, INSTRUCTOR or ADMIN."); }
    }

    /** Refuses to remove the last active admin by demotion, suspension or deletion. */
    private void requireAnotherActiveAdmin(User target) {
        if (target.getRole() == Role.ADMIN && target.getStatus() == UserStatus.ACTIVE && users.countByRoleAndStatus(Role.ADMIN, UserStatus.ACTIVE) <= 1)
            throw err(HttpStatus.CONFLICT, "This is the last active admin. Create or promote another admin first.");
    }

    // ================= reports =================

    @Transactional(readOnly = true)
    public PlatformReport report() {
        List<Course> all = courses.findAll();
        BigDecimal gross = BigDecimal.ZERO;
        List<CourseSales> rows = new ArrayList<>();
        for (Course c : all) {
            long n = mapper.students(c);
            BigDecimal rev = c.getPrice().multiply(BigDecimal.valueOf(n));
            gross = gross.add(rev);
            rows.add(new CourseSales(c.getId(), c.getTitle(), n, rev));
        }
        Instant since = Instant.now().minus(30, ChronoUnit.DAYS);
        long recent = users.findAll().stream().filter(u -> u.getCreatedAt().isAfter(since)).count();
        long pending = users.findAll().stream().filter(u -> u.getRole() == Role.INSTRUCTOR && u.getApproval() == ApprovalStatus.PENDING).count();
        long suspended = users.findAll().stream().filter(u -> u.getStatus() == UserStatus.SUSPENDED).count();
        List<CourseSales> top = rows.stream().filter(r -> r.students() > 0).sorted(Comparator.comparingLong(CourseSales::students).reversed()).limit(6).toList();
        return new PlatformReport(users.count(), users.countByRole(Role.STUDENT), users.countByRole(Role.INSTRUCTOR), users.countByRole(Role.ADMIN), pending, suspended,
            courses.count(), courses.countByStatus(CourseStatus.PUBLISHED), courses.countByStatus(CourseStatus.PENDING_REVIEW), courses.countByStatus(CourseStatus.DRAFT),
            courses.countByStatus(CourseStatus.REJECTED), courses.countByStatus(CourseStatus.ARCHIVED), enrollments.count(), gross, recent, top);
    }

    // ================= users =================

    private AdminUserView view(User u) {
        return new AdminUserView(u.getId(), u.getName(), u.getEmail(), u.getRole().name(), u.getHeadline(), u.getStatus().name(), u.getApproval().name(),
            u.getApprovalNote(), u.getCreatedAt(), courses.countByInstructorId(u.getId()), enrollments.countByStudentId(u.getId()));
    }

    @Transactional(readOnly = true)
    public List<AdminUserView> listUsers() { return users.findTop500ByOrderByCreatedAtDesc().stream().map(this::view).toList(); }

    public AdminUserView createUser(User actor, CreateUserRequest r) {
        if (users.existsByEmailIgnoreCase(r.email().trim())) throw err(HttpStatus.CONFLICT, "An account with this email already exists.");
        Role role = parseRole(r.role());
        User u = new User(r.name().trim(), r.email().trim(), encoder.encode(r.password()), role);
        u.setApproval(ApprovalStatus.APPROVED); // admin-created accounts are trusted
        users.save(u);
        audit.log(actor, "USER_CREATED", "USER", u.getId(), u.getEmail() + " as " + role);
        return view(u);
    }

    public AdminUserView updateUser(User actor, Long id, UpdateUserRequest r) {
        User u = user(id);
        u.setName(r.name().trim()); u.setHeadline(r.headline());
        audit.log(actor, "USER_UPDATED", "USER", id, u.getEmail());
        return view(u);
    }

    public AdminUserView changeRole(User actor, Long id, String roleName) {
        User u = user(id);
        Role to = parseRole(roleName);
        if (u.getId().equals(actor.getId())) throw err(HttpStatus.CONFLICT, "You cannot change your own role.");
        if (u.getRole() == to) return view(u);
        if (u.getRole() == Role.ADMIN) requireAnotherActiveAdmin(u);
        if (to == Role.STUDENT && courses.countByInstructorId(id) > 0)
            throw err(HttpStatus.CONFLICT, "This user owns courses. Archive or delete them before changing the role to student.");
        Role from = u.getRole();
        u.setRole(to);
        u.setApproval(ApprovalStatus.APPROVED); // a role assigned by an admin is already vetted
        u.setApprovalNote(null);
        audit.log(actor, "ROLE_CHANGED", "USER", id, u.getEmail() + ": " + from + " -> " + to);
        return view(u);
    }

    public AdminUserView setUserStatus(User actor, Long id, String statusName) {
        User u = user(id);
        UserStatus to;
        try { to = UserStatus.valueOf(statusName.trim().toUpperCase()); } catch (IllegalArgumentException e) { throw err(HttpStatus.BAD_REQUEST, "Status must be ACTIVE or SUSPENDED."); }
        if (u.getId().equals(actor.getId())) throw err(HttpStatus.CONFLICT, "You cannot suspend your own account.");
        if (to == UserStatus.SUSPENDED) requireAnotherActiveAdmin(u);
        u.setStatus(to);
        audit.log(actor, to == UserStatus.SUSPENDED ? "USER_SUSPENDED" : "USER_REACTIVATED", "USER", id, u.getEmail());
        return view(u);
    }

    public AdminUserView decideInstructor(User actor, Long id, String decision, String reason) {
        User u = user(id);
        if (u.getRole() != Role.INSTRUCTOR) throw err(HttpStatus.CONFLICT, "Only instructor accounts need approval.");
        switch (decision.trim().toUpperCase()) {
            case "APPROVE" -> { u.setApproval(ApprovalStatus.APPROVED); u.setApprovalNote(null); }
            case "REJECT" -> {
                if (reason == null || reason.isBlank()) throw err(HttpStatus.BAD_REQUEST, "Give a short reason so the instructor knows what to fix.");
                u.setApproval(ApprovalStatus.REJECTED); u.setApprovalNote(reason.trim());
            }
            default -> throw err(HttpStatus.BAD_REQUEST, "Decision must be APPROVE or REJECT.");
        }
        audit.log(actor, "INSTRUCTOR_" + u.getApproval(), "USER", id, u.getEmail() + (u.getApprovalNote() == null ? "" : ": " + u.getApprovalNote()));
        return view(u);
    }

    /** Deletion is only for accounts with no history. Anyone with courses or enrolments should be suspended instead. */
    public void deleteUser(User actor, Long id) {
        User u = user(id);
        if (u.getId().equals(actor.getId())) throw err(HttpStatus.CONFLICT, "You cannot delete your own account.");
        requireAnotherActiveAdmin(u);
        if (courses.countByInstructorId(id) > 0 || enrollments.countByStudentId(id) > 0)
            throw err(HttpStatus.CONFLICT, "This user has courses or enrolments. Suspend the account instead of deleting it.");
        users.delete(u);
        audit.log(actor, "USER_DELETED", "USER", id, u.getEmail());
    }

    // ================= courses =================

    @Transactional(readOnly = true)
    public List<CourseView> listCourses() {
        return courses.findAllByOrderByCreatedAtDesc().stream().map(mapper::withRevenue)
            .sorted(Comparator.comparing((CourseView v) -> !"PENDING_REVIEW".equals(v.status()))).toList(); // review queue first, stable otherwise
    }

    /**
     * APPROVE publishes a course (from review, or directly for admins). REJECT sends a pending course back with a reason.
     * UNPUBLISH takes a live course down with a reason; the instructor can edit and resubmit.
     */
    public CourseView reviewCourse(User actor, Long id, String decision, String reason) {
        Course c = course(id);
        String d = decision.trim().toUpperCase();
        String note = reason == null ? "" : reason.trim();
        switch (d) {
            case "APPROVE" -> {
                if (c.getStatus() == CourseStatus.PUBLISHED) throw err(HttpStatus.CONFLICT, "This course is already published.");
                if (c.getModules().stream().mapToInt(m -> m.getLessons().size()).sum() == 0) throw err(HttpStatus.UNPROCESSABLE_ENTITY, "A course needs at least one lesson before it can be published.");
                c.setStatus(CourseStatus.PUBLISHED); c.setRejectionReason(null);
            }
            case "REJECT" -> {
                if (c.getStatus() != CourseStatus.PENDING_REVIEW) throw err(HttpStatus.CONFLICT, "Only courses waiting for review can be rejected.");
                if (note.isEmpty()) throw err(HttpStatus.BAD_REQUEST, "Give a short reason so the instructor knows what to change.");
                c.setStatus(CourseStatus.REJECTED); c.setRejectionReason(note);
            }
            case "UNPUBLISH" -> {
                if (c.getStatus() != CourseStatus.PUBLISHED) throw err(HttpStatus.CONFLICT, "Only published courses can be taken down.");
                if (note.isEmpty()) throw err(HttpStatus.BAD_REQUEST, "Give a short reason for taking the course down.");
                c.setStatus(CourseStatus.REJECTED); c.setRejectionReason(note);
            }
            default -> throw err(HttpStatus.BAD_REQUEST, "Decision must be APPROVE, REJECT or UNPUBLISH.");
        }
        audit.log(actor, "COURSE_" + d, "COURSE", id, c.getTitle() + (note.isEmpty() ? "" : ": " + note));
        return mapper.withRevenue(c);
    }

    public CourseView setBadge(User actor, Long id, String badge) {
        Course c = course(id);
        String b = badge == null || badge.isBlank() ? null : badge.trim().toUpperCase();
        if (b != null && !BADGES.contains(b)) throw err(HttpStatus.BAD_REQUEST, "Badge must be NEW, HOT, FEATURED or SPECIAL (or empty).");
        c.setBadge(b);
        audit.log(actor, "COURSE_BADGE", "COURSE", id, c.getTitle() + " -> " + (b == null ? "none" : b));
        return mapper.withRevenue(c);
    }

    public void deleteCourse(User actor, Long id) {
        Course c = course(id);
        Set<Long> lessonIds = c.getModules().stream().flatMap(m -> m.getLessons().stream()).map(Lesson::getId).collect(Collectors.toSet());
        if (!lessonIds.isEmpty()) progress.deleteByLessonIds(lessonIds);
        enrollments.deleteAll(enrollments.findByCourseId(id));
        courses.delete(c);
        audit.log(actor, "COURSE_DELETED", "COURSE", id, c.getTitle());
    }

    // ================= categories =================

    @Transactional(readOnly = true)
    public List<CategoryView> listCategories() {
        return categories.findAllByOrderByNameAsc().stream().map(c -> new CategoryView(c.getId(), c.getName(), courses.countByCategoryIgnoreCase(c.getName()))).toList();
    }

    public CategoryView createCategory(User actor, String name) {
        String n = name.trim();
        if (categories.existsByNameIgnoreCase(n)) throw err(HttpStatus.CONFLICT, "That category already exists.");
        Category c = categories.save(new Category(n));
        audit.log(actor, "CATEGORY_CREATED", "CATEGORY", c.getId(), n);
        return new CategoryView(c.getId(), c.getName(), 0);
    }

    public CategoryView renameCategory(User actor, Long id, String name) {
        Category c = categories.findById(id).orElseThrow(() -> notFound("category"));
        String n = name.trim();
        categories.findByNameIgnoreCase(n).filter(x -> !x.getId().equals(id)).ifPresent(x -> { throw err(HttpStatus.CONFLICT, "That category already exists."); });
        String old = c.getName();
        courses.renameCategory(old, n); // keeps existing courses attached to the renamed category
        c.setName(n);
        audit.log(actor, "CATEGORY_RENAMED", "CATEGORY", id, old + " -> " + n);
        return new CategoryView(c.getId(), n, courses.countByCategoryIgnoreCase(n));
    }

    public void deleteCategory(User actor, Long id) {
        Category c = categories.findById(id).orElseThrow(() -> notFound("category"));
        if (courses.countByCategoryIgnoreCase(c.getName()) > 0) throw err(HttpStatus.CONFLICT, "Courses still use this category. Move or rename them first.");
        categories.delete(c);
        audit.log(actor, "CATEGORY_DELETED", "CATEGORY", id, c.getName());
    }

    // ================= enrolments =================

    private AdminEnrollmentView view(Enrollment e) {
        int total = (int) e.getCourse().getModules().stream().mapToLong(m -> m.getLessons().size()).sum();
        int done = progress.findByEnrollment(e.getId()).size();
        return new AdminEnrollmentView(e.getId(), e.getStudent().getId(), e.getStudent().getName(), e.getStudent().getEmail(), e.getCourse().getId(),
            e.getCourse().getTitle(), total == 0 ? 0 : Math.round(done * 100f / total), e.getEnrolledAt());
    }

    @Transactional(readOnly = true)
    public List<AdminEnrollmentView> listEnrollments() { return enrollments.findTop200ByOrderByEnrolledAtDesc().stream().map(this::view).toList(); }

    public AdminEnrollmentView enroll(User actor, Long studentId, Long courseId) {
        User s = user(studentId);
        if (s.getRole() != Role.STUDENT || s.getStatus() != UserStatus.ACTIVE) throw err(HttpStatus.CONFLICT, "Only active student accounts can be enrolled.");
        Course c = course(courseId);
        if (c.getStatus() != CourseStatus.PUBLISHED) throw err(HttpStatus.CONFLICT, "Only published courses can be enrolled in.");
        Enrollment e = enrollments.findByStudentIdAndCourseId(studentId, courseId).orElseGet(() -> {
            Enrollment n = enrollments.save(new Enrollment(s, c));
            audit.log(actor, "ENROLLMENT_CREATED", "ENROLLMENT", n.getId(), s.getEmail() + " -> " + c.getTitle());
            return n;
        });
        return view(e);
    }

    public void cancelEnrollment(User actor, Long id) {
        Enrollment e = enrollments.findById(id).orElseThrow(() -> notFound("enrolment"));
        progress.deleteAll(progress.findByEnrollment(id));
        enrollments.delete(e);
        audit.log(actor, "ENROLLMENT_CANCELLED", "ENROLLMENT", id, e.getStudent().getEmail() + " / " + e.getCourse().getTitle());
    }

    // ================= audit =================

    @Transactional(readOnly = true)
    public List<AuditView> audit() {
        return auditLogs.findTop200ByOrderByCreatedAtDesc().stream()
            .map(a -> new AuditView(a.getId(), a.getActorEmail(), a.getAction(), a.getTargetType(), a.getTargetId(), a.getDetails(), a.getCreatedAt())).toList();
    }
}
