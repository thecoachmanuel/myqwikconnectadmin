$(document).ready(function () {
    $(".sideBarli").removeClass("activeLi");
    $(".otherSideA").addClass("activeLi");

    $(document).on("change", "#is_dating", function (event) {
        event.preventDefault();

        if ($(this).prop("checked") == true) {
            var value = 1;
        } else {
            value = 0;
        }
        console.log(value);

        var updateEventStatusUrl =
            `${domainUrl}changeFromDatingAppToLivestreamApp` + "/" + value;

        $.getJSON(updateEventStatusUrl).done(function (data) {
            if (data.status) {
                iziToast.success({
                    title: "Update Successful..",
                    message: "Settings Updated Successfully !",
                    position: "topRight",
                });
            } else {
                iziToast.error({
                    title: "Failed!",
                    message: "Something went wrong!",
                    position: "topRight",
                });
            }
        });
    });

    $(document).on("change", "#is_social_media", function (event) {
        event.preventDefault();

        if ($(this).prop("checked") == true) {
            var value = 1;
        } else {
            value = 0;
        }

        var updateEventStatusUrl =
            `${domainUrl}changeFromSocialMedia` + "/" + value;

        $.getJSON(updateEventStatusUrl).done(function (data) {
            if (data.status) {
                iziToast.success({
                    title: "Update Successful..",
                    message: "Settings Updated Successfully !",
                    position: "topRight",
                });
            } else {
                iziToast.error({
                    title: "Failed!",
                    message: "Something went wrong!",
                    position: "topRight",
                });
            }
        });
    });

    $(document).on(
        "change",
        "#include_fake_user_in_matching",
        function (event) {
            event.preventDefault();

            if ($(this).prop("checked") == true) {
                var value = 1;
            } else {
                value = 0;
            }

            var updateEventStatusUrl =
                `${domainUrl}includeFakeUserInMatching` + "/" + value;

            $.getJSON(updateEventStatusUrl).done(function (data) {
                if (data.status) {
                    iziToast.success({
                        title: "Update Successful..",
                        message: "Settings Updated Successfully !",
                        position: "topRight",
                    });
                } else {
                    iziToast.error({
                        title: "Failed!",
                        message: "Something went wrong!",
                        position: "topRight",
                    });
                }
            });
        }
    );

    $(".appdataForm").on("submit", function (event) {
        event.preventDefault();

        if (user_type == "1") {
            var formdata = new FormData($(this)[0]);

            $.ajax({
                url: `${domainUrl}updateAppdata`,
                type: "POST",
                data: formdata,
                dataType: "json",
                contentType: false,
                cache: false,
                processData: false,
                success: function (response) {
                    console.log(response);

                    if (response.status == true) {
                        // location.reload();
                        iziToast.success({
                            title: `${app.Success}!`,
                            message: `${app.settingUpdatedSuccessfully}`,
                            position: "topRight",
                        });
                    }
                },
                error: function (err) {
                    $(".loader").hide();

                    console.log(err);
                },
            });
        } else {
            $(".loader").hide();
            iziToast.error({
                title: `${app.Error}!`,
                message: `${app.tester}`,
                position: "topRight",
            });
        }
    });

    $("#deepLinkingForm").on("submit", function (event) {
        event.preventDefault();

        if (user_type == "1") {
            var formdata = new FormData($(this)[0]);

            $.ajax({
                url: `${domainUrl}updateAppdata`,
                type: "POST",
                data: formdata,
                dataType: "json",
                contentType: false,
                cache: false,
                processData: false,
                success: function (response) {
                    console.log(response);

                    if (response.status == true) {
                        // location.reload();
                        iziToast.success({
                            title: `${app.Success}!`,
                            message: `${app.settingUpdatedSuccessfully}`,
                            position: "topRight",
                        });
                    }
                },
                error: function (err) {
                    $(".loader").hide();

                    console.log(err);
                },
            });
        } else {
            $(".loader").hide();
            iziToast.error({
                title: `${app.Error}!`,
                message: `${app.tester}`,
                position: "topRight",
            });
        }
    });

    $("#androidDeepLinkingForm").on("submit", function (e) {
        e.preventDefault();
        if (user_type == "1") {
            var url = `${domainUrl}androidDeepLinking`;
            let formData = new FormData($("#androidDeepLinkingForm")[0]);

            let shaValues = [];
            $(".sha-input").each(function () {
                let val = $(this).val().trim();
                if (val) shaValues.push(val);
            });
            formData["sha_256"] = shaValues.join(",");

            $.ajax({
                type: "POST",
                url: url,
                data: formData,
                contentType: false,
                processData: false,
                success: function (response) {
                    if (response.status == true) {
                        // location.reload();
                        iziToast.success({
                            title: `${app.Success}!`,
                            message: `${app.settingUpdatedSuccessfully}`,
                            position: "topRight",
                        });
                    }
                },
            });
        } else {
            $(".loader").hide();
            iziToast.error({
                title: `${app.Error}!`,
                message: `${app.tester}`,
                position: "topRight",
            });
        }
    });

    $("#iOSDeepLinkingForm").on("submit", function (e) {
        e.preventDefault();
        if (user_type == "1") {
            var url = `${domainUrl}iOSDeepLinking`;
            let formData = new FormData($("#iOSDeepLinkingForm")[0]);

            $.ajax({
                type: "POST",
                url: url,
                data: formData,
                contentType: false,
                processData: false,
                success: function (response) {
                    if (response.status) {
                        iziToast.success({
                            title: `${app.Success}!`,
                            message: `${app.settingUpdatedSuccessfully}`,
                            position: "topRight",
                        });
                    }
                },
            });
        } else {
            $(".loader").hide();
            iziToast.error({
                title: `${app.Error}!`,
                message: `${app.tester}`,
                position: "topRight",
            });
        }
    });

    $(".otherForm").on("submit", function (event) {
        event.preventDefault();
        $(".loader").show();

        if (user_type == "1") {
            var formdata = new FormData($(this)[0]);

            $.ajax({
                url: `${domainUrl}updateOther`,
                type: "POST",
                data: formdata,
                dataType: "json",
                contentType: false,
                cache: false,
                processData: false,
                success: function (response) {
                    console.log(response);

                    if (response.status == true) {
                        location.reload();
                    }
                },
                error: function (err) {
                    $(".loader").hide();

                    console.log(JSON.stringify(err));
                },
            });
        } else {
            $(".loader").hide();
            iziToast.error({
                title: `${app.Error}!`,
                message: `${app.tester}`,
                position: "topRight",
            });
        }
    });

    $("#changePasswordForm").on("submit", function (e) {
        e.preventDefault();
        if (user_type == "1") {
            let formData = new FormData($("#changePasswordForm")[0]);
            $.ajax({
                type: "POST",
                url: `${domainUrl}changePassword`,
                data: formData,
                contentType: false,
                processData: false,
                success: function (response) {
                    if (response.status) {
                        iziToast.success({
                            title: `${app.Success}!`,
                            message: `${app.settingUpdatedSuccessfully}`,
                            position: "topRight",
                        });
                        $("#changePasswordForm")[0].reset();
                    } else if (response.status == false) {
                        iziToast.show({
                            title: "Oops",
                            message: response.message,
                            color: "red",
                            position: "topRight",
                            transitionIn: "fadeInDown",
                            transitionOut: "fadeOutUp",
                            timeout: 3000,
                            animateInside: false,
                            iconUrl: `${domainUrl}assets/img/x.svg`,
                        });
                    }
                },
            });
        } else {
            $(".loader").hide();
            iziToast.error({
                title: `${app.Error}!`,
                message: `${app.tester}`,
                position: "topRight",
            });
        }
    });

    function togglePasswordVisibility(
        eyeSelector,
        eyeOffSelector,
        inputSelector
    ) {
        const eye = document.querySelector(eyeSelector);
        const eyeOff = document.querySelector(eyeOffSelector);
        const passwordField = document.querySelector(inputSelector);

        if (!eye || !eyeOff || !passwordField) return; // safeguard

        eye.addEventListener("click", () => {
            eye.style.display = "none";
            eyeOff.style.display = "block";
            passwordField.type = "text";
        });

        eyeOff.addEventListener("click", () => {
            eyeOff.style.display = "none";
            eye.style.display = "block";
            passwordField.type = "password";
        });
    }

    // Call the function for each password field
    togglePasswordVisibility(
        ".feather-eye",
        ".feather-eye-off",
        "input[type=password]"
    );
    togglePasswordVisibility(".eye", ".eye-off", "input#userPassword");
    togglePasswordVisibility(".eye1", ".eye-off1", "input#newPassword");
});
