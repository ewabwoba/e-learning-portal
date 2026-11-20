package com.coursely.model;

import java.util.EnumSet;
import java.util.Set;

/**
 * Fine-grained permissions. Roles are just named bundles of permissions, so adding a role later
 * (for example a MODERATOR with only REVIEW_COURSES) means adding one mapping here, not touching controllers.
 * Permissions are exposed to Spring Security as authorities and checked with @PreAuthorize("hasAuthority('...')").
 */
public enum Permission {
    // learning
    BROWSE_COURSES, MANAGE_OWN_PROFILE, ENROLL, LEARN, TRACK_PROGRESS,
    // teaching (own courses only; ownership is enforced in the service layer)
    CREATE_COURSE, EDIT_OWN_COURSE, SUBMIT_COURSE, VIEW_OWN_STUDENTS, VIEW_OWN_ANALYTICS,
    // administration
    MANAGE_USERS, MANAGE_ROLES, APPROVE_INSTRUCTORS, MANAGE_ANY_COURSE, REVIEW_COURSES,
    MANAGE_CATEGORIES, MANAGE_ENROLLMENTS, VIEW_PLATFORM_REPORTS, VIEW_AUDIT_LOG;

    private static final Set<Permission> STUDENT = EnumSet.of(BROWSE_COURSES, MANAGE_OWN_PROFILE, ENROLL, LEARN, TRACK_PROGRESS);
    private static final Set<Permission> INSTRUCTOR = EnumSet.of(BROWSE_COURSES, MANAGE_OWN_PROFILE,
        CREATE_COURSE, EDIT_OWN_COURSE, SUBMIT_COURSE, VIEW_OWN_STUDENTS, VIEW_OWN_ANALYTICS);

    public static Set<Permission> of(Role role) {
        return switch (role) {
            case STUDENT -> STUDENT;
            case INSTRUCTOR -> INSTRUCTOR;
            case ADMIN -> EnumSet.allOf(Permission.class);
        };
    }
}
