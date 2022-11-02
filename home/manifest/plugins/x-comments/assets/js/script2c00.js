(function() {
    if (typeof jQuery == 'function') {
        x_Comment_Init();
    }
    else {
        window.x_Comment_Init_Holder = setInterval(function() {
            if (typeof jQuery == 'function') {
                clearInterval(window.x_Comment_Init_Holder);
                x_Comment_Init();
            }
            else {
                console.log("Waiting for jquery");
            }
        }, 3000);
    }
})();

function x_Comment_Init() {
    x_Comment_Bind_Events();
    x_Comment_Find_Selector();
    $(window).on('hashchange', function () {
        x_Comment_Find_Selector();
        x_Comment_Bind_Events();
    });
    console.log("xComments inited");
}

function x_Comment_Remove_Hash() {
    history.pushState("", document.title, window.location.pathname + window.location.search);
}

function x_Comment_Find_Selector() {
    (function($) {
        var url = document.location.toString();
        if (url.match('#')) {
            var target = url.split('#')[1];
            if (target != undefined && (target.indexOf("comment") >= 0 || target.indexOf("post") >= 0)) {
                var target_comment_id = target.replace('comment-', '');
                target_comment_id = target_comment_id.replace('post-', '');
                setTimeout(function() {
                    var $tar = $("#" + target);
                    if ($tar.length > 0) {
                        console.log($tar);
                        console.log($tar.offset());
                        $("*").removeClass("x_comment_selected_elemet");
                        $tar.addClass("x_comment_selected_elemet");
                        $("html, body").delay(1500).animate({
                            scrollTop: $tar.offset().top - 200
                        }, 1500);
                        $(".x_comments_fixed_message").html('').hide();
                        x_Comment_Remove_Hash();
                    } else {
                        $(".x_comments_fixed_message").html("Aradığınız yorum yükleniyor..");
                        var findedInChilds = false;
                        $(".x_child_comment_toggle").each(function(e) {
                            $toggleItem = $(this);
                            var childIds = ($(this).attr("data-child-comment-ids") || '').split(',');
                            $.each(childIds, function(index, item) {
                                if (item == target_comment_id) {
                                    $toggleItem.trigger("click");
                                    findedInChilds = true;
                                    return;
                                }
                            });
                        });
                        if (!findedInChilds) {
                            $("[onclick='x_Load_Comments_Paged(this)']").trigger("click");
                        }
                    }
                }, 300);
            }
        }
    })(jQuery);
}

function x_Comment_Bind_Events() {
    (function($) {
        $(".x_comment_toggle_content").click(function(e) {
            $("#" + $(this).attr("data-target")).show();
            $(this).remove();
        });
        $(".x_comment_editor").focus(function() {
            $form = $(this).parents("form:first");
            $form.find(".x_comment_buttons").addClass("active");
        });
    })(jQuery);
}

function x_Comment_Send_Data(e, successCallback, errorCallback) {
    return jQuery.ajax({
        url: x_comment_ajax.ajaxurl,
        data: e,
        method: 'post',
        dataType: 'json',
        success: successCallback,
        error: errorCallback
    });
}

function x_Cancel_Comment(e) {
    (function($) {
        $(e).parents("form:first").find("textarea, input[type='text']").removeClass("error");
        $(e).parents("form:first").find("textarea, input[type='text']").val('').trigger('change');
        $(e).parents(".x_comment_buttons:first").removeClass("active");
        if ($(e).parents(".x_comment_form_answer").length > 0) {
            $(e).parents(".x_comment_form_answer").remove();
        }
    })(jQuery);
}

function x_Spoiler_Comment(e) {
    (function($) {
        if ($(e).hasClass("active")) {
            $(e).removeClass("active");
            $(e).parents("form:first").find("[name=comment_spoiler]").val(0);
        } else {
            $(e).addClass("active");
            $(e).parents("form:first").find("[name=comment_spoiler]").val(1);
        }
    })(jQuery);
}

function x_Answer_Comment(e) {
    (function($) {
        var $container = $(e).parents(".x_comment_container");
        var parent_id = $(e).parents(".x_comment_container").attr("data-id");
        var post_id = $(e).parents(".x_comment_container").attr("data-postid");
        var $template = $(".x_comment_reply_container").find(".x_comment_form").clone();
        $template.find("[name=parent_id]").val(parent_id);
        $(".x_comment_form_answer.for_" + parent_id).remove();
        $container.append($('<div class="x_comment_form_answer for_' + parent_id + '"></div>'));
        $(".x_comment_form_answer.for_" + parent_id).append($template);
        x_Comment_Bind_Events();
        $(".x_comment_form_answer.for_" + parent_id).find("textarea").focus();
    })(jQuery);
}

function x_Load_Comments(e) {
    (function($) {
        $this = $(e);
        $container = $this.parents(".x_comment_container:first");
        var parent_id = $(e).attr("data-parentid");
        var post_id = $(e).attr("data-postid");
        var post_type = $(e).attr("data-posttype");
        var depth = $(e).attr("data-depth");
        $this.html(x_comment_ajax.loading);
        var requestData = "action=load_comments&parent_id=" + parent_id + "&post_id=" + post_id + "&depth=" + depth + "&post_type=" + post_type;
        x_Comment_Send_Data(requestData, function(response) {
            if (response.data.state) {
                $this.remove();
                $container.after(response.data.rawhtml);
                if (window.ll != undefined)
                    window.ll.update();
                x_Comment_Bind_Events();
                setTimeout(function() {
                    x_Comment_Find_Selector();
                }, 1500);
            } else {
                $this.html(response.data.message);
            }
        });
    })(jQuery);
}

function x_Load_Comments_Paged(e, clear, post_id, post_type, comment_count, page_id) {
    (function($) {
        if (e != null && e != undefined) {
            $this = $(e);
            post_id = $this.attr("data-postid");
            post_type = $this.attr("data-posttype");
            page_id = $this.attr("data-pageid");
            comment_count = $this.attr("data-commentcount");
            $this.attr("disabled", "disabled");
            var old_text = $this.html();
            $this.html(x_comment_ajax.loading);
            if (window.ll != undefined)
                window.ll.update();
        } else {
            $this = null;
        }
        var list_type = $(".x_comments").attr("data-listtype");
        var requestData = "action=load_comments_more&post_id=" + post_id + "&post_type=" + post_type + "&comment_count=" + comment_count + "&page_id=" + page_id + "&list_type=" + list_type;
        x_Comment_Send_Data(requestData, function(response) {
            if (response.data.state) {
                if ($this != null && $this != undefined) {
                    $this.remove();
                }
                if (clear != undefined) {
                    $(".x_comments").find(".x_comment_container").remove();
                    $(".x_comments").find(".x_comment_clearfix").remove();
                    $(".x_comments").find(".x_comment_text_button").remove();
                }
                $(".x_comments").append(response.data.rawhtml);
                if (window.ll != undefined)
                    window.ll.update();
                x_Comment_Bind_Events();
                $(".x_comment_seperator:last").remove();
                x_Comment_Find_Selector();
            } else {
                if ($this != null && $this != undefined) {
                    $this.html(old_text);
                }
            }
        });
    })(jQuery);
}

function x_Send_Comment(e) {
    (function($) {
        var $this = $(e);
        $this.attr("disabled", "disabled");
        $form = $(e).parents("form:first");
        $form.find(".x_messages").html('');
        var sendOk = true;
        $form.find("[required]").each(function(e1) {
            var val = ($(this).val() || '');
            if (val == '' || val == null || val == undefined) {
                $(this).addClass("error");
                sendOk = false;
            } else {
                $(this).removeClass("error");
            }
        });
        if (sendOk) {
            var requestData = $form.find("input,select,textarea").serialize();
            requestData += "&action=send_comment";
            var post_id = $form.find("[name=post_id]").val();
            var post_type = $form.find("[name=post_type]").val();
            var comment_count = $(".x_comments").attr("data-commentcount");
            $form.find("input[type=text],textarea").attr("disabled", "disabled");
            x_Comment_Send_Data(requestData, function(response) {
                if (response.data.state) {
                    setTimeout(function() {
                        $this.removeAttr("disabled");
                        $form.find("input[type=text],textarea").removeAttr("disabled");
                        $form.find("[name=x_comment_content]").val('').trigger("change");
                        $form.find("[name=x_comment_author]").val('').trigger("change");
                        $form.find("[name=x_comment_author_email]").val('').trigger("change");
                    }, 1500);
                    x_Load_Comments_Paged(null, 1, post_id, post_type, comment_count, 0);
                } else {
                    $this.removeAttr("disabled");
                    $form.find("input[type=text],textarea").removeAttr("disabled");
                    $form.find(".x_messages").html(response.data.message);
                }
            });
        }
    })(jQuery);
}

function x_Comment_Show_Orders() {
    (function($) {
        $(".x_comments_order_options").toggle();
    })(jQuery);
}

function x_Comment_Vote(e, type) {
    (function($) {
        var requestData = "action=vote_comment&comment_id=" + $(e).parents(".x_comment_container").attr("data-id") + "&type=" + type;
        x_Comment_Send_Data(requestData, function(response) {
            if (response.data.state) {
                $(e).find(".count").text(response.data.rawhtml);
            }
        });
    })(jQuery);
}

function x_Comment_Change_Order(list_type, e, list_type_nice) {
    (function($) {
        $(".x_comments_order_button").removeClass("active");
        $(e).addClass("active");
        $(".x_comments").attr("data-listtype", list_type);
        var post_id = $(".x_comments").attr("data-postid");
        var post_type = $(".x_comments").attr("data-posttype");
        var comment_count = $(".x_comments").attr("data-commentcount");
        x_Load_Comments_Paged(null, 1, post_id, post_type, comment_count, 0);
        $(".x_comments_order_text").html(list_type_nice);
    })(jQuery);
}

function x_Comment_Report(e) {
    (function($) {
        var $container = $(e).parents(".x_comment_container");
        var comment_id = $(e).parents(".x_comment_container").attr("data-id");
        var $template = $(".x_comment_report_container").find(".x_comment_form").clone();
        $template.find("[name=comment_id]").val(comment_id);
        $(".x_comment_form_report.for_" + comment_id).remove();
        $container.append($('<div class="x_comment_form_report for_' + comment_id + '"></div>'));
        $(".x_comment_form_report.for_" + comment_id).append($template);
        x_Comment_Bind_Events();
        $(".x_comment_form_report.for_" + comment_id).find("textarea").focus();
    })(jQuery);
}

function x_Cancel_Report(e) {
    (function($) {
        if ($(e).parents(".x_comment_form_report").length > 0) {
            $(e).parents(".x_comment_form_report").remove();
        }
    })(jQuery);
}

function x_Send_Report(e) {
    (function($) {
        var $this = $(e);
        $this.attr("disabled", "disabled");
        $form = $(e).parents("form:first");
        $form.find(".x_messages").html('');
        var sendOk = true;
        $form.find("[required]").each(function(e1) {
            var val = ($(this).val() || '');
            if (val == '' || val == null || val == undefined) {
                $(this).addClass("error");
                sendOk = false;
            } else {
                $(this).removeClass("error");
            }
        });
        if (sendOk) {
            var requestData = $form.find("input,select,textarea").serialize();
            requestData += "&action=report_comment";
            $form.find("input[type=text],textarea").attr("disabled", "disabled");
            x_Comment_Send_Data(requestData, function(response) {
                if (response.data.state) {
                    $form.parents(".x_comment_form_report:first").remove();
                } else {
                    $this.removeAttr("disabled");
                    $form.find("input[type=text],textarea").removeAttr("disabled");
                    $form.find(".x_messages").html(response.data.message);
                }
            });
        }
    })(jQuery);
}

function x_Action_Comment(e, action) {
    (function($) {
        var requestData = "action=action_comment&comment_id=" + $(e).parents(".x_comment_container").attr("data-id") + "&act=" + action;
        if (action == "fix") {
            var custom_order = prompt(x_comment_ajax.fixcommentprompt, "1");
            requestData += "&ext=" + custom_order;
        }
        x_Comment_Send_Data(requestData, function(response) {
            if (response.data.state) {
                var post_id = $(".x_comments").attr("data-postid");
                var post_type = $(".x_comments").attr("data-posttype");
                var comment_count = $(".x_comments").attr("data-commentcount");
                x_Load_Comments_Paged(null, 1, post_id, post_type, comment_count, 0);
            } else {
                alert(response.data.message);
            }
        });
    })(jQuery);
}