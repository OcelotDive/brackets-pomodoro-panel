/*eslint-env browser*/
define(function (require, exports, module) {

    var CommandManager = brackets.getModule("command/CommandManager"),
        Menus = brackets.getModule("command/Menus"),
        PanelManager = brackets.getModule("view/WorkspaceManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        AppInit = brackets.getModule("utils/AppInit");
    var POMODORO_TIMER = "pomodoro.execute";
    var panel;
    var panelHtml = require("text!panel.html");
    var closeButton;
    var addTaskButton;
    var timerInterval;
    var timerPause = true;
    var onBreak = false;
    var sliderValue;
    
    var KEY_BINDINGS = [
        {
            key: "Ctrl-Shift-P",
            platform: "win"
        },
        {
            key: "Ctrl-Shift-P",
            platform: "mac"
        },
        {
            key: "Ctrl-Shift-P"
        }
    ];
    
    function handleCurrentMode() {
      var statusLabel = document.querySelector(".pomodoro-status-label");
        if(timerPause) {
            statusLabel.textContent = "Paused";
            statusLabel.style.color = "#fff";
        }
        if(!timerPause && onBreak) {
            statusLabel.textContent = "Break Mode";
            statusLabel.style.color = "#33C4FF";
        }
        if(!timerPause && !onBreak) {
            statusLabel.textContent = "Work Mode";
            statusLabel.style.color = "#4CAF50";
        }
    }
    
    function handleMenuClick() {
        if (panel.isVisible()) {
            panel.hide();
            CommandManager.get(POMODORO_TIMER).setChecked(false);
        } else {
            panel.show();
            CommandManager.get(POMODORO_TIMER).setChecked(true);
        }
    }

    function handleCloseClick() {
        panel.hide();
        CommandManager.get(POMODORO_TIMER).setChecked(false);
    }

    function handleAddTask() {
        var textField = document.querySelector(".pomodoro-inputField");
        textField.setAttribute("placeholder", "ADD TASK");
        if (textField.value !== "") {
            var taskList = document.querySelector(".pomodoro-toDoList");
            var listItem = document.createElement("li");
            var removeButton = document.createElement("button");
            removeButton.setAttribute("class", "pomodoro-removeButton")
            listItem.setAttribute("class", "pomodoro-listItem");
            listItem.appendChild(document.createTextNode(textField.value));
            listItem.appendChild(removeButton);
            taskList.appendChild(listItem);
            textField.value = "";
        } else {
            textField.setAttribute("placeholder", "CREATE TASK TITLE HERE");
        }
    }

    function handleTimeOutOpen() {
        var startPauseButton = document.querySelector('.pomodoro-start-pause');
        if (!onBreak) {
            if (!panel.isVisible()) {
                panel.show();
                CommandManager.get(POMODORO_TIMER).setChecked(true);
                startPauseButton.style.backgroundColor = '#4CAF50';
                timerPause = true;
            } else {
                startPauseButton.style.backgroundColor = '#4CAF50';
                timerPause = true;
            }
        } 
        else {
            if (!panel.isVisible()) {
                panel.show();
                CommandManager.get(POMODORO_TIMER).setChecked(true);
                startPauseButton.style.backgroundColor = '#6699CC';
                timerPause = true;
            } 
            else {
                startPauseButton.style.backgroundColor = '#6699CC';
                timerPause = true;
            }
        }
    }

    function handleTaskDone(e) {
        if (e.target.className === "pomodoro-removeButton") {
            e.target.parentElement.parentElement.removeChild(e.target.parentElement);
        }
    }

    function updateTimer(targetTime) {
        return {
            'hours': Math.floor((targetTime / (1000 * 60 * 60)) % 24),
            'minutes': Math.floor((targetTime / 1000 / 60) % 60),
            'seconds': Math.floor((targetTime / 1000) % 60),
            'total': targetTime
        };
    }

    function animateClock(span) {
        span.className = !timerPause ? "pomodoro-span spinSpan" : "pomodoro-span";
        setTimeout(function () {
            span.className = "pomodoro-span";
        }, 700)
    }

    function handleStartPause() {
        var startPauseButton = document.querySelector('.pomodoro-start-pause');
        startPauseButton.addEventListener('click', function () {
            timerPause = !timerPause;
            timerPause ? this.style.backgroundColor = '#4CAF50' : this.style.backgroundColor = '#6699CC';
        });
    }

    function startCount(targetTime) {

        timerInterval = setInterval(function () {
            var pomodoro = document.querySelector('.pomodoro-timer');
            var timer = updateTimer(targetTime);
            
            targetTime = !timerPause ? targetTime - 1000 : targetTime;
            timer.hours < 10 ? timer.hours = "0" + timer.hours : timer.hours;
            timer.minutes < 10 ? timer.minutes = "0" + timer.minutes : timer.minutes;
            timer.seconds < 10 ? timer.seconds = "0" + timer.seconds : timer.seconds;
            pomodoro.innerHTML =
                '<span class="pomodoro-span">' + timer.hours + '</span>' +
                '<span class="pomodoro-span">' + timer.minutes + '</span>' +
                '<span class="pomodoro-span">' + timer.seconds + '</span>';



            //Take care of span styles whilst ticking
            var spans = pomodoro.getElementsByClassName("pomodoro-span");
            if (targetTime < 120000 && !onBreak) {
                spans[2].style.color = 'red';
                spans[1].style.color = 'red';
                spans[0].style.color = 'red';
            } else if (onBreak) {
                spans[2].style.color = '#33C4FF';
                spans[1].style.color = '#33C4FF';
                spans[0].style.color = '#33C4FF';
            }


            //animateClock(spans[3]);
            if (timer.seconds < 59) animateClock(spans[2]);
            if (timer.minutes < 59 && timer.seconds === 59) animateClock(spans[1]);
            if (timer.hours < 23 && timer.minutes === 59 && timer.seconds === 59) animateClock(spans[0])

            //When timer reaches the end decide to break or end
            if (timer.total < 1 && !onBreak && sliderValue > 0) {
                clearInterval(timerInterval);
                pomodoro.innerHTML = '<span class="pomodoro-span">00</span><span class="pomodoro-span">00</span><span class="pomodoro-span">00</span>';
                startCount(sliderValue);
                onBreak = true;
                handleTimeOutOpen();
                timerPause = false;
                
                

            } else if (timer.total < 1) {
                clearInterval(timerInterval);
                pomodoro.innerHTML = '<span class="pomodoro-span">00</span><span class="pomodoro-span">00</span><span class="pomodoro-span">00</span>';
                onBreak = false;
                handleTimeOutOpen();
            }
            handleCurrentMode()
        }, 1000);
    }

    function setPomodoro() {
        var radioButtons = Array.from(document.querySelectorAll('.pomodoro-radio'));
        radioButtons.forEach(function (radioButton) {
            radioButton.addEventListener('change', function () {
                if (radioButton.checked) {
                    onBreak = false;
                    clearInterval(timerInterval);
                    startCount(radioButton.value);
                }
            })
        })
    }

    function handleBreakSlider() {
        var slider = document.querySelector(".pomodoro-break-slider");
        var sliderLabel = document.querySelector(".pomodoro-mins-label");
        sliderLabel.textContent = "Break Mins: ";
        slider.oninput = function () {
            sliderLabel.textContent = "Break Mins: " + this.value * 5;
            sliderValue = (((this.value * 5) * 60) * 1000);
        }

    }


    AppInit.appReady(function () {
        ExtensionUtils.loadStyleSheet(module, "pomodoro.css");
        CommandManager.register("Pomodoro Panel", POMODORO_TIMER, handleMenuClick);
        
        var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
        menu.addMenuItem(POMODORO_TIMER, KEY_BINDINGS);
    
        panel = PanelManager.createBottomPanel(POMODORO_TIMER, $(panelHtml), 200);

        closeButton = document.querySelector(".pomodoro-closeButton");
        closeButton.addEventListener("click", handleCloseClick);

        addTaskButton = document.querySelector(".pomodoro-addTaskButton");
        addTaskButton.addEventListener("click", handleAddTask);

        var listNodes = document.querySelector(".pomodoro-toDoList");
        listNodes.addEventListener("click", handleTaskDone);
        var targetTime = 1500000;
        handleStartPause();
        startCount(targetTime);
        setPomodoro();
        handleBreakSlider();

    });

});
