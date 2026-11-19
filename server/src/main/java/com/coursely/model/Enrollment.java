package com.coursely.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "enrollments", uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "course_id"}))
public class Enrollment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "student_id") private User student;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "course_id") private Course course;
    @Column(nullable = false) private Instant enrolledAt = Instant.now();

    protected Enrollment() {}
    public Enrollment(User student, Course course) { this.student = student; this.course = course; }
    public Long getId() { return id; }
    public User getStudent() { return student; }
    public Course getCourse() { return course; }
    public Instant getEnrolledAt() { return enrolledAt; } public void setEnrolledAt(Instant v) { enrolledAt = v; }
}
