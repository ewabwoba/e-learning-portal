package com.coursely.config;

import com.coursely.model.*;
import com.coursely.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Demo content mirroring the frontend's offline data. Runs only when coursely.seed.enabled=true AND the database is empty.
 * Demo accounts use a well-known password: disable seeding (COURSELY_SEED=false) in any shared or production environment.
 */
@Configuration
@ConditionalOnProperty(name = "coursely.seed.enabled", havingValue = "true")
public class DataSeeder {
    private static final String PASSWORD = "Password123!";

    private record C(String title, String cat, String level, int inst, double price, Double was, String badge, double rating, int students, String desc, String img, String topic) {}

    @Bean @Order(1)
    CommandLineRunner seed(UserRepository users, CourseRepository courses, EnrollmentRepository enrollments, LessonProgressRepository progress,
                           PasswordEncoder enc, TransactionTemplate tx) {
        return args -> tx.executeWithoutResult(s -> {
            if (users.count() > 0) return;
            String hash = enc.encode(PASSWORD);
            User amara = users.save(new User("Amara Wanjiku", "instructor@coursely.dev", hash, Role.INSTRUCTOR)); amara.setHeadline("Product designer & educator");
            User daniel = users.save(new User("Daniel Mwangi", "daniel@coursely.dev", hash, Role.INSTRUCTOR)); daniel.setHeadline("Senior front-end engineer");
            User grace = users.save(new User("Grace Njeri", "grace@coursely.dev", hash, Role.INSTRUCTOR)); grace.setHeadline("Founder & business mentor");
            User jordan = users.save(new User("Jordan Davis", "student@coursely.dev", hash, Role.STUDENT));
            User mia = users.save(new User("Mia Otieno", "mia@example.com", hash, Role.STUDENT));
            User liam = users.save(new User("Liam Kariuki", "liam@example.com", hash, Role.STUDENT));
            for (User t : List.of(amara, daniel, grace)) t.setApproval(ApprovalStatus.APPROVED); // demo instructors are already vetted
            users.save(new User("Platform Admin", "admin@coursely.dev", hash, Role.ADMIN));
            User newcomer = users.save(new User("Nia Kamau", "pending@coursely.dev", hash, Role.INSTRUCTOR)); // awaiting approval: shows the admin queue
            newcomer.setHeadline("Marketing strategist");
            User[] teachers = {null, amara, daniel, grace};
            String u = "https://images.unsplash.com/photo-%s?auto=format&fit=crop&w=900&q=80";
            List<C> defs = List.of(
                new C("Art Painting Essentials: Draw What You See", "Art & Design", "Beginner", 1, 32.99, 58.99, "NEW", 5.0, 214, "Develop a confident eye and steady hand. Learn composition, light and colour through short, practical studio sessions.", "1513364776144-60967b0f800f", "Art Painting"),
                new C("Minimalism: How to Make Things Simpler", "Communication", "Beginner", 3, 40.99, 45.99, "HOT", 4.8, 1320, "Cut the noise from your work, your messages and your space. A calm, practical system for saying and doing more with less.", "1517842645767-c639042777db", "Minimalism"),
                new C("How to Be a DJ? Make Electronic Music", "Music", "Intermediate", 2, 22.55, 49.99, "FEATURED", 5.0, 876, "From beat matching to your first original track. Build a complete set and learn the production workflow used by working DJs.", "1470225620780-dba8ba36b745", "Electronic Music"),
                new C("Graphic Design Basics Masterclass", "Art & Design", "Beginner", 1, 24.99, null, null, 4.7, 1950, "Typography, colour, layout and brand systems. Finish with a portfolio-ready identity project.", "1626785774573-4b799315345d", "Graphic Design"),
                new C("Modern Web Development with React", "Development", "Intermediate", 2, 109.99, 129.99, "HOT", 4.9, 3140, "Build fast, accessible, production-ready interfaces with React, routing and clean architecture.", "1498050108023-c5249f4df085", "React"),
                new C("Road Bike Manual: How to Be a Champion", "Communication", "Intermediate", 3, 12.99, 49.99, null, 4.6, 640, "Training blocks, fuelling, bike handling and race craft, explained clearly by a coach who has been there.", "1485965120184-e220f721d03e", "Road Cycling"),
                new C("Landscape Photography: Capture Beautiful Scenes", "Photography", "Beginner", 1, 14.99, 39.99, "HOT", 4.9, 2210, "Plan, shoot and edit landscapes that feel like the moment you remember. Light, composition and post-processing.", "1506905925346-21bda4d32df4", "Landscape Photography"),
                new C("Digital Marketing Masterclass", "Marketing", "Beginner", 3, 9.90, 14.45, "SPECIAL", 4.8, 1810, "Create campaigns that connect with real audiences. SEO, content, email and paid channels in one practical programme.", "1460925895917-afdab827c52f", "Digital Marketing"),
                new C("Fashion Photography with a Professional", "Photography", "Advanced", 1, 35.00, null, "SPECIAL", 5.0, 420, "Direct a shoot from concept to final retouch. Lighting setups, posing, working with models and delivering for clients.", "1516035069371-29a1b244cc32", "Fashion Photography"));

            List<Course> saved = new ArrayList<>();
            for (int i = 0; i < defs.size(); i++) {
                C d = defs.get(i);
                Course c = new Course(teachers[d.inst()]);
                c.setTitle(d.title()); c.setCategory(d.cat()); c.setLevel(d.level()); c.setDescription(d.desc());
                c.setPrice(BigDecimal.valueOf(d.price())); c.setOriginalPrice(d.was() == null ? null : BigDecimal.valueOf(d.was()));
                c.setImageUrl(u.formatted(d.img())); c.setBadge(d.badge()); c.setRating(d.rating()); c.setRatingCount(d.students() / 6);
                c.setStudentsBase(d.students()); c.setStatus(CourseStatus.PUBLISHED); c.setCreatedAt(Instant.now().minus(i, ChronoUnit.DAYS));
                curriculum(c, d.topic());
                saved.add(courses.save(c));
            }
            Course draft = new Course(amara);
            draft.setTitle("Brand Storytelling for Creators"); draft.setCategory("Marketing"); draft.setLevel("Intermediate");
            draft.setDescription("Shape a brand voice and tell stories that people remember and share."); draft.setPrice(BigDecimal.valueOf(29));
            CourseModule dm = new CourseModule(draft); dm.setTitle("Finding your voice"); dm.setPosition(0);
            Lesson dl = new Lesson(dm); dl.setTitle("What makes a story stick"); dl.setDurationMinutes(12); dm.getLessons().add(dl); draft.getModules().add(dm);
            draft.setStatus(CourseStatus.PENDING_REVIEW); // waiting in the admin review queue
            courses.save(draft);

            enroll(enrollments, progress, jordan, saved.get(6), 20, 6, 6);
            enroll(enrollments, progress, jordan, saved.get(4), 12, 3, 3);
            enroll(enrollments, progress, jordan, saved.get(2), 3, 1, 0);
            enroll(enrollments, progress, mia, saved.get(6), 9, 1, 2);
            enroll(enrollments, progress, liam, saved.get(6), 6, 0, 0);
            enroll(enrollments, progress, mia, saved.get(8), 1, 1, 0);
        });
    }

    /** Standard three-module, eleven-lesson curriculum. */
    private static void curriculum(Course c, String topic) {
        Object[][] mods = {
            {"Getting started with " + topic, new Object[][]{{"Welcome and course roadmap", "VIDEO", 6}, {"What you will build", "VIDEO", 9}, {"Tools and setup checklist", "READING", 8}}},
            {"Core techniques", new Object[][]{{"The fundamentals, step by step", "VIDEO", 24}, {"Guided practice session", "VIDEO", 31}, {"Common mistakes to avoid", "READING", 10}, {"Techniques recap", "VIDEO", 14}}},
            {"Putting it into practice", new Object[][]{{"Project brief", "READING", 7}, {"Build along, part 1", "VIDEO", 38}, {"Build along, part 2", "VIDEO", 42}, {"Review, polish and share", "VIDEO", 18}}}};
        for (int mi = 0; mi < mods.length; mi++) {
            CourseModule m = new CourseModule(c); m.setTitle((String) mods[mi][0]); m.setPosition(mi);
            Object[][] ls = (Object[][]) mods[mi][1];
            for (int li = 0; li < ls.length; li++) {
                Lesson l = new Lesson(m); l.setTitle((String) ls[li][0]); l.setType(LessonType.valueOf((String) ls[li][1])); l.setDurationMinutes((Integer) ls[li][2]); l.setPosition(li);
                if (l.getType() == LessonType.READING) l.setContent("Key ideas from \"" + l.getTitle() + "\": read through the notes, try the exercise, and write down one thing you would do differently.");
                m.getLessons().add(l);
            }
            c.getModules().add(m);
        }
    }

    private static void enroll(EnrollmentRepository er, LessonProgressRepository pr, User student, Course course, int daysAgo, int completeCount, int lastDoneDaysAgo) {
        Enrollment e = new Enrollment(student, course); e.setEnrolledAt(Instant.now().minus(daysAgo, ChronoUnit.DAYS)); er.save(e);
        List<Lesson> lessons = course.getModules().stream().flatMap(m -> m.getLessons().stream()).toList();
        for (int i = 0; i < Math.min(completeCount, lessons.size()); i++) {
            LessonProgress p = new LessonProgress(e, lessons.get(i));
            p.setCompletedAt(Instant.now().minus(Math.max(0, lastDoneDaysAgo + (completeCount - 1 - i)), ChronoUnit.DAYS));
            pr.save(p);
        }
    }
}
