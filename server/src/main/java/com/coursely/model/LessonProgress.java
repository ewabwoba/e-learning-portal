package com.coursely.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "lesson_progress", uniqueConstraints = @UniqueConstraint(columnNames = {"enrollment_id", "lesson_id"}))
public class LessonProgress {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "enrollment_id") private Enrollment enrollment;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "lesson_id") private Lesson lesson;
    @Column(nullable = false) private Instant completedAt = Instant.now();

    protected LessonProgress() {}
    public LessonProgress(Enrollment enrollment, Lesson lesson) { this.enrollment = enrollment; this.lesson = lesson; }
    public Enrollment getEnrollment() { return enrollment; }
    public Lesson getLesson() { return lesson; }
    public Instant getCompletedAt() { return completedAt; } public void setCompletedAt(Instant v) { completedAt = v; }
}
