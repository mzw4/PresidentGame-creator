
$(function() {
    // ================== Global vars ==================

    curPanel = '#global_options_panel';
    // win_criterion = ['public image', 'funding']
    win_criterion = {}

    flag_set = new Set()

    events = {};
    flags = {};


    // ================== Init ==================
    
    $( "#draggable" ).draggable();
    initSelect();

    // ================== Templates ==================

    var win_criteria_template = Handlebars.compile($("#win_criteria_template").html());
    var choice_template = Handlebars.compile($("#choice_template").html());
    var event_text_template = Handlebars.compile($("#event_text_template").html());
    var flag_template = Handlebars.compile($("#flag_template").html());
    var reply_template = Handlebars.compile($("#reply_template").html());
    var trigger_template = Handlebars.compile($("#trigger_template").html());
    var required_event_template = Handlebars.compile($("#required_event_template").html());
    var required_event_choice_template = Handlebars.compile($("#required_event_choice_template").html());
    var required_points_template = Handlebars.compile($("#required_points_template").html());

    // ================== Event handlers ==================

    // ================== Navigation ==================

    $('#open_event_panel_button').on('click', function(event) {
        event.preventDefault();
        showPanel('#event_creation_form');
    });

    $('#open_global_options_button').on('click', function(event) {
        event.preventDefault();
        showPanel('#global_options_panel');
    });

    $('#view_story_button').on('click', function(event) {
        event.preventDefault();
        showPanel('#story_view');
    });

    // ================== Adding components ==================

    $('#event_creation_form').on('submit', function(event) {
        event.preventDefault();
    });
    $(document).keypress(function(e) {
        if(e.which == 13) {
            e.preventDefault();
        }
    });

    $('#add_choice_button').on('click', function(event) {
        event.preventDefault();
        $('#choices').append(choice_template({'win_criterion': Object.keys(win_criterion)}));
        initSelect();    
    });

    $('#add_win_criteria_button').on('click', function(event) {
        event.preventDefault();
        $('#win_criterion').append(win_criteria_template({}));
    });

    $('#add_event_text_button').on('click', function(event) {
        event.preventDefault();
        $('#event_texts').append(event_text_template({}));
    });

    $('body').on('click', '.add_trigger_button', function(event) {
        event.preventDefault();
        $(this).prev('.trigger_list').append(trigger_template({}));
    });

    $('body').on('click', '.add_reply_button', function(event) {
        event.preventDefault();
        $(this).prev('.replies').append(reply_template({}));
    });

    // required event choice populate choices
    $('body').on('change', 'select.required_eventchoice_select', function(event) {
        var $select = $(this).closest('.required_event_choice').find('select.required_choice_select');
        
        var eventKey = $(this).val();
        if(eventKey in events) {
            events[eventKey].choices.forEach(function(choice, i) {
                console.log(choice);
                $select.append('<option value="' + choice.key + '">' + choice.key + '</option>');
            });
            initSelect();
        }
    });

    $('#add_requirement_button').on('click', function(event) {
        event.preventDefault();
        var type = $('#requirement_type_select').val();
        if(type === 'event') {
            $('#requirements').append(required_event_template({ 'events': Object.keys(events) }));
        } else if (type === 'event_choice') {
            $('#requirements').append(required_event_choice_template({ 'events': Object.keys(events) }));
        } else {
            $('#requirements').append(required_points_template({'win_criterion': Object.keys(win_criterion)}));
        }
        initSelect();
    });

    // create event
    $('#create_event_button').on('click', function(event) {
        event.preventDefault();

    });

    // save global options
    $('#save_global_options_button').on('click', function(event) {
        event.preventDefault();

        win_criterion = {}
        $('#global_options_panel .win_criteria').each(function(i, crit_input) {
            var criteria = {}
            var $inputs = $(this).find(':input')
            $inputs.each(function(i, input) {
                criteria[input.name] = $(this).val();
            });
            if(criteria['name']) {
                win_criterion[criteria['name']] = criteria['weight'];
            }
        });
        console.log(win_criterion);

    });

    // add flag to event choice
    $('body').on('keyup', '.flag_input', function (e) {
        if (e.keyCode == 13) {
            flag_name = $(this).val()
            if(flag_name) {
                $(this).prev('.flag_list').append(flag_template({'name':flag_name}));
                $(this).val('');
            }
        }
    });

    $('body').on('click', '.delete_button', function() {
        $(this).parent().remove();
    });

    $('#save_event_button').on('click', function(event) {
        event.preventDefault();
        saveEvent($('#event_creation_form'));
    });

    $('#export_button').on('click', function(event) {
        event.preventDefault();
        console.log('exporting');
        exportGame();
    });

    // initialize all select components
    function initSelect() {
        $('select').material_select();
    }

    // Display the specified panel
    function showPanel(panelId) {
        $(curPanel).fadeOut(100, function() {
            $(panelId).fadeIn(100, function() {
                curPanel = panelId;
            });
        });
    }

    function exportGame() {
        var game_settings = {}
        game_settings['points_categories'] = win_criterion;

        var data = {}
        data['game_settings'] = game_settings;
        data['events'] = events;
        data['flags'] = flag_set;

        console.log({'data': JSON.stringify(data) });

        $.post('/save_game', {'data': JSON.stringify(data) }, function(response) {
            console.log(response);
        }, 'json');
    }

    // Save the event to memory
    function saveEvent($eventForm) {
        // event info
        var $info = $eventForm.find('#event_info');
        var key = $info.find('#event_key').val();
        var time = $info.find('#event_time').val();

        // incoming texts
        var incoming_texts = [];
        $eventForm.find('#event_texts .incoming_text').each(function(i, text) {
            incoming_text.push($(text).val());
        });

        // requiremnts
        var requirements = []
        var $requirements = $eventForm.find('#requirements');
        $requirements.find('.required_event').each(function(i, req) {
            var req_obj = {}
            req_obj['type'] = 'event';
            req_obj['eventKey'] = $(req).find('select.required_event_select').val();
            requirements.push(req_obj);
        });
        $requirements.find('.required_event_choice').each(function(i, req) {
            var req_obj = {}
            req_obj['type'] = 'event_choice';
            req_obj['eventKey'] = $(req).find('select.required_eventchoice_select').val();
            req_obj['choice'] = $(req).find('select.required_choice_select').val();
            requirements.push(req_obj);
        });
        $requirements.find('.required_points').each(function(i, req) {
            var req_obj = {}
            req_obj['type'] = 'points';
            req_obj['points_category'] = $(req).find('select.required_points_category_select').val();
            req_obj['val'] = $(req).find('.required_val').val();
            requirements.push(req_obj);
        });

        // triggers
        var event_triggers = [];
        $eventForm.find('#event_triggers .trigger_list .trigger').each(function(i, trig) {
            var eventKey = $(trig).find('#event_key').val();
            var time = $(trig).find('#event_time').val();
            if(eventKey) {
                event_triggers.push(createTrigger(eventKey, time));
            }
        });

        // get choices
        var choices = []
        $eventForm.find('.choice').each(function(i, choice) {
            $choice = $(choice);
            var key = $choice.find('#event_choice_key').val()
            var text = $choice.find('#event_choice_text').val()

            // choice replies
            var replies = []
            $choice.find('.replies .reply_item .reply_text').each(function(i, reply) {
                replies.push($(reply).val());
            });

            // choice win condition effects
            var effects = {}
            $choice.find('.win_condition_effect').each(function(i, eff) {
                var condition = $(eff).find('select').val();
                var val = $(eff).find('.effect_val').val();
                if(condition && val !== 0) {
                    effects[condition] = val;
                }
            });

            // choice triggers
            var triggers = [];
            $choice.find('.trigger_list .trigger').each(function(i, trig) {
                var eventKey = $(trig).find('#event_key').val();
                var time = $(trig).find('#event_time').val();
                if(eventKey) {
                    triggers.push(createTrigger(eventKey, time));
                }
            });

            // choice flags
            var flags = [];
            $choice.find('.flag_list .flag_name').each(function(i, flag) {
                var flag_name = $(flag).text();
                if (flag_name) {
                    flags.push(flag_name);
                }
            });


            var choice = createChoice(key, text, effects, triggers, flags, replies);
            choices.push(choice);
        });

        createEvent(key, time, requirements, event_triggers, choices);
    }

    /**
     * Create a choice
     */
    function createTrigger(eventKey, time) {
        trigger = {
            'eventKey': eventKey,
            'time': time
        }
        return trigger;
    }

    /**
     * Create a choice
     */
    function createChoice(key, text, effect, triggers, flags, replies) {
        choice = {
            'key': key,
            'text': text,
            'effects': effect,
            'triggers': triggers,
            'flags': flags,
            'replies': replies
        }
        return choice;
    }

    /**
     * Create an event
     */
    function createEvent(name, time, requirements, triggers, choices) {
        children = [];
        // $.each(choices, function(choice) {
        //     $.each(choice.triggers, function(trig) {
        //         children.push(trig.eventKey);
        //     });
        // });

        game_event = {
            'name': name,
            'time': time,
            'requirements': requirements,
            'triggers': triggers,
            'choices': choices,
            'children': children
        }
        events[name] = game_event;
        console.log(game_event);
        return game_event;
    }

});