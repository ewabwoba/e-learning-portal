package com.coursely.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "courses")
public class Course {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 180) private String title;
    @Column(nullable = false, length = 80) private String category;
    @Column(nullable = false, length = 30) private String level;
    @Column(length = 2000) private String description;
    @Column(nullable = false, precision = 8, scale = 2) private BigDecimal price;
    @Column(precision = 8, scale = 2) private BigDecimal originalPrice;
    @Column(length = 500) private String imageUrl;
    @Column(length = 20) private String badge;
    /** Rating columns are seeded values until a review feature is added. */
    @Column(nullable = false) private double rating = 0;
    @Column(nullable = false) private int ratingCount = 0;
    /** Students already counted before this system (seed data); live enrolments are added on top. */
    @Column(nullable = false) private int studentsBase = 0;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private CourseStatus status = CourseStatus.DRAFT;
    /** Why an admin rejected or took down the course. Shown to the instructor. */
    @Column(length = 500) private String rejectionReason;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "instructor_id") private User instructor;
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true) @OrderBy("position ASC")
    private List<CourseModule> modules = new ArrayList<>();
    @Column(nullable = false) private Instant createdAt = Instant.now();

    protected Course() {}
    public Course(User instructor) { this.instructor = instructor; }

    public Long getId() { return id; }
    public String getTitle() { return title; } public void setTitle(String v) { title = v; }
    public String getCategory() { return category; } public void setCategory(String v) { category = v; }
    public String getLevel() { return level; } public void setLevel(String v) { level = v; }
    public String getDescription() { return description; } public void setDescription(String v) { description = v; }
    public BigDecimal getPrice() { return price; } public void setPrice(BigDecimal v) { price = v; }
    public BigDecimal getOriginalPrice() { return originalPrice; } public void setOriginalPrice(BigDecimal v) { originalPrice = v; }
    public String getImageUrl() { return imageUrl; } public void setImageUrl(String v) { imageUrl = v; }
    public String getBadge() { return badge; } public void setBadge(String v) { badge = v; }
    public double getRating() { return rating; } public void setRating(double v) { rating = v; }
    public int getRatingCount() { return ratingCount; } public void setRatingCount(int v) { ratingCount = v; }
    public int getStudentsBase() { return studentsBase; } public void setStudentsBase(int v) { studentsBase = v; }
    public CourseStatus getStatus() { return status; } public void setStatus(CourseStatus v) { status = v; }
    public String getRejectionReason() { return rejectionReason; } public void setRejectionReason(String v) { rejectionReason = v; }
    public User getInstructor() { return instructor; }
    public List<CourseModule> getModules() { return modules; }
    public Instant getCreatedAt() { return createdAt; } public void setCreatedAt(Instant v) { createdAt = v; }
}
