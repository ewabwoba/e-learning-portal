package com.coursely.model;

import jakarta.persistence.*;

@Entity
@Table(name = "lessons")
public class Lesson {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "module_id") private CourseModule module;
    @Column(nullable = false, length = 180) private String title;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private LessonType type = LessonType.VIDEO;
    @Column(nullable = false) private int durationMinutes;
    @Column(nullable = false) private int position;
    /** Video URL for VIDEO lessons or body text for READING lessons. Only served to enrolled learners. */
    @Column(length = 4000) private String content;

    protected Lesson() {}
    public Lesson(CourseModule module) { this.module = module; }
    public Long getId() { return id; }
    public CourseModule getModule() { return module; }
    public String getTitle() { return title; } public void setTitle(String v) { title = v; }
    public LessonType getType() { return type; } public void setType(LessonType v) { type = v; }
    public int getDurationMinutes() { return durationMinutes; } public void setDurationMinutes(int v) { durationMinutes = v; }
    public int getPosition() { return position; } public void setPosition(int v) { position = v; }
    public String getContent() { return content; } public void setContent(String v) { content = v; }
}
