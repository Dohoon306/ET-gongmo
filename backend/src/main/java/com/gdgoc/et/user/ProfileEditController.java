package com.gdgoc.et.user;

import com.gdgoc.et.common.web.CurrentUser;
import com.gdgoc.et.user.ProfileEditService.MyAccount;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class ProfileEditController {

    private final ProfileEditService profileEdit;

    public record NameBody(String name) {}

    public record IntroBody(String intro) {}

    @GetMapping("/me")
    public MyAccount me(@CurrentUser Long userId) {
        return profileEdit.me(userId);
    }

    @PutMapping("/me/name")
    public MyAccount changeName(@CurrentUser Long userId, @RequestBody NameBody body) {
        return profileEdit.changeName(userId, body.name());
    }

    @PutMapping("/me/intro")
    public MyAccount changeIntro(@CurrentUser Long userId, @RequestBody IntroBody body) {
        return profileEdit.changeIntro(userId, body.intro());
    }
}
