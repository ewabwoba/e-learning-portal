package com.coursely;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CourselyApiTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private String login(String email) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\"}")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("token").asText();
    }

    @Test void healthAndPublicCatalogueAreOpen() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk());
        mvc.perform(get("/api/courses")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(9)));
    }

    @Test void publicCourseDetailNeverLeaksLessonContent() throws Exception {
        mvc.perform(get("/api/courses/1")).andExpect(status().isOk()).andExpect(jsonPath("$.modules[0].lessons[2].content").doesNotExist());
    }

    @Test void protectedEndpointsRequireAuthAndRole() throws Exception {
        mvc.perform(get("/api/enrollments/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/instructor/courses").header("Authorization", "Bearer " + login("student@coursely.dev"))).andExpect(status().isForbidden());
    }

    @Test void badLoginIsRejected() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"student@coursely.dev\",\"password\":\"nope\"}"))
            .andExpect(status().isUnauthorized());
    }

    @Test void studentCanEnrolAndTrackProgress() throws Exception {
        String t = "Bearer " + login("liam@example.com");
        mvc.perform(post("/api/enrollments").header("Authorization", t).contentType(MediaType.APPLICATION_JSON).content("{\"courseId\":8}")).andExpect(status().isCreated());
        JsonNode course = json.readTree(mvc.perform(get("/api/learn/courses/8").header("Authorization", t)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        long lesson = course.get("modules").get(0).get("lessons").get(0).get("id").asLong();
        mvc.perform(post("/api/learn/courses/8/lessons/" + lesson + "/toggle").header("Authorization", t))
            .andExpect(status().isOk()).andExpect(jsonPath("$.completed").value(true)).andExpect(jsonPath("$.completedLessons").value(1));
    }

    @Test void learnerCannotOpenCourseTheyAreNotEnrolledIn() throws Exception {
        mvc.perform(get("/api/learn/courses/9").header("Authorization", "Bearer " + login("liam@example.com"))).andExpect(status().isForbidden());
    }

    @Test void instructorCannotEditAnotherInstructorsCourse() throws Exception {
        // Course 3 belongs to Daniel; Amara must not see it.
        mvc.perform(get("/api/instructor/courses/3").header("Authorization", "Bearer " + login("instructor@coursely.dev"))).andExpect(status().isNotFound());
    }

    @Test void registrationValidatesAndRejectsDuplicates() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\",\"email\":\"bad\",\"password\":\"short\"}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.email").exists());
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"X\",\"email\":\"student@coursely.dev\",\"password\":\"Password123!\"}"))
            .andExpect(status().isConflict());
    }
}
