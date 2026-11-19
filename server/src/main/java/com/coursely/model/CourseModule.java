package com.coursely.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "course_modules")
public class CourseModule {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "course_id") private Course course;
    @Column(nullable = false, length = 180) private String title;
    @Column(nullable = false) private int position;
    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, orphanRemoval = true) @OrderBy("position ASC")
    private List<Lesson> lessons = new ArrayList<>();

    protected CourseModule() {}
    public CourseModule(Course course) { this.course = course; }
    public Long getId() { return id; }
    public Course getCourse() { return course; }
    public String getTitle() { return title; } public void setTitle(String v) { title = v; }
    public int getPosition() { return position; } public void setPosition(int v) { position = v; }
    public List<Lesson> getLessons() { return lessons; }
}
