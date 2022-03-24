var tasks = {};

var createTask = function (taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");

  var taskSpan = $("<span>")
    .addClass("badge badge-save badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

// when a task element is sent into the auditTask() function, we can get the date information and parse it into a Moment object using Moment.js
var auditTask = function (taskEl) {
  // get date from task element
  // use jQuery to select the taskEl element and find the <span> element inside it, then retrieve the text value using .text(); we chained on a JavaScript (not jQuery) .trim() method to cut off any possible leading or trailing empty spaces
  // when the .trim() method is used, it ensures no unnecessary empty spaces are in the beginning or end of the string
  
  var date = $(taskEl).find("span").text().trim();

  // once the date information is stored into the date variable, we must pass that value into the moment() function to turn it into a Moment object
  // first, we use the date variable we created from taskEl to make a new Moment object, configured for the user's local time using moment(date, "L")
  // because the date variable does not specify a time of day (i.e. "11/23/2019"), the Moment object will default to 12:00am
  // because work usually doesn't end at 12:00am, we convert it to 5:00pm of that day instead, using the .set("hour", 17) method (value 17 in 24-hr time, or 5:00pm)
  // convert to moment object at 5:00pm
  var time = moment(date, "L").set("hour", 17);
  
  // remove any old classes from element if they were already in place (i.e. if we update the due date from yesterday to a week from now, that red background will be removed, as it will no longer be overdue)
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // apply new class if task is near/over due date
  // moment()isAfter(time) code inside the if statement is known as the query method; this means that we can perform simple true or false checks on the date for more information about it
  // when read from left to right, tthe isAfter() gets the current time from moment() and checks if that value comes later than the value of the time variable (we're checking if the current date and time are later than the date and time we pulled from taskEl; if so, the date and time from taskEl are in the past, and we add the list-group-item-danger bootstrap class to the entire task element --> thus, giving it a red background, to let users know the date has passed)
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
    // to see how many days away the due date is
    // performs from left to right --> when we use moment() to get right now and use .diff() afterwards to get the difference of right now to a day in the future, we'll get a negative number back (we have to check if the difference is >= -2)
    // testing for a number less than +2 not a number greater than -2
    // the abs() method ensures we're getting the absolute value of that number
    // .diff() method gets the difference between the first date and the date provided in the ()
  } else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

var loadTasks = function () {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function (list, arr) {
    // then loop over sub-array
    arr.forEach(function (task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function () {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// delegates clicks to the parent <ul> with class list-group
// the value of 'this' always refers to the entire jQuery element in an .on() callback function
$(".list-group").on("click", "p", function () {
  var text = $(this)
    // will get the inner text content of the current element
    .text()
    // removes any extra white space before or after
    .trim();
  // $("textarea") tells jQuery to find all existing <textarea> elements and uses the element as a selector; $("<textarea>") tells jQuery to create a new <textarea> element and uses the HTML syntax for an opening tage to indicate the element to be created
  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);
  // swaps out existing <p> elements with the new <textarea>
  $(this).replaceWith(textInput);
  // automatically highlights the input box when clicked
  text.Input.trigger("focus");
});

// triggers blur event as soon as the user interacts with anything other than the <textarea> element
$(".list-group").on("blur", "textarea", function () {

  // i.e.:
  // text = "Walk the dog";
  // status = "toDo";
  // index = 0;

  // get the textarea's current value/text
  var text = $(this)
    .val()
    .trim();

  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // tasks is an object; tasks[status] returns an array (i.e. toDo); tasks[status][index] returns the object at the given index in the array; tasks[status][index].text returns the text property of the object at the given index --> tasks.toDo[0].text = "Walk the dog";
  tasks[status][index].text = text;
  // updating tasks was necessary for localStorage, so we call saveTasks() immediately afterwards
  saveTasks();

  // recreate p element
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);

  // replace textarea with p element
  $(this).replaceWith(taskP);
});

// due date was clicked
$(".list-group").on("click", "span", function () {
  // get current text
  var date = $(this)
    .text()
    .trim();

  // create new input element
  var dateInput = $("<input>")
    // with one argument, it gets an attribute (i.e. attr("id")); with two arguments, it sets an attribute (i.e. attr("type","text")) --> type = "text"
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  // swap out elements
  $(this).replaceWith(dateInput);

  // enable jquery ui datepicker
  dateInput.datepicker({
    minDate: 1,
    // onClose allows us to execute a function when the date picker closes; it may close when a user clicks anywhere on the page outside the date picker; now when we go to update a due date and decide to leave it as is, we can click off of the date picker and the <span> element will reappear with the original date; by adding the onClose method, we can instruct the dateInput element to trigger its own change event and execute the callback function tied to it
    onClose: function () {
      // when calendar is closed, force a "change" event on the 'dateInput'
      $(this).trigger("change");
    }
  });

  // automatically focus on new element
  dateInput.trigger("focus");
});

// value of due date was changed
// listen for a change rather than a blur; useful for when we click off of the date picker because we've decided not to edit the due date --> the <input> element remains and doesn't switch back to the actua; date's <span> element
$(".list-group").on("change", "input[type='text']", function () {
  // get current text
  var date = $(this)
    .val()
    .trim();

  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // update task in array and re-save to localStorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-save badge-pill")
    .text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);

  // pass task's <li> element into auditTask() to check new date
  auditTask($(taskSpan).closest(".list-group-item"));
});

// turns every element with the class list-group into a sortable list
$(".card .list-group").sortable({
  // links the sortable lists with any other lists that have the same class
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  // tells jQuery to create a copy of the dragged element and move the copy instead of the original; this is necessary to prevent click events from accidentally triggering on the original element.
  helper: "clone",
  // activate and deactivate events trigger once for all connected lists as soon as dragging starts and stops
  activate: function (event) {
    // select this and add the class of dropover to it
    // all task boxes receive the dropover class as they turn grey
    $(this).addClass("dropover");
    // when you pick up a task while sorting, the light red trash appears
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function (event) {
    // select this and remove the class of dropover from it
    // when dragging stops, all classes are removed!
    $(this).removeClass("dropover");
    // when you let go of a task while sorting, the light red trash goes away
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  // over and out events trigger when a dragged item enters or leaves a connected list
  over: function (event) {
    // select event.target and add the class of dropover-active to it
    // task boxes turn black when an element is dragged over it
    $(event.target).addClass("dropover-active");
  },
  out: function (event) {
    // select event.target and remove the class of dropover-active from it
    // task boxes turn back to grey when an element is not over it
    $(event.target).removeClass("dropover-active");
  },
  // update even triggers when the contents of a list have changed (i.e. the items were re-ordered, an item was removed, or an item was added)
  update: function (event) {
    // array to store the task data in
    var tempArr = [];
    // the children() method returns an array of the list element's children (the <li> elements, labeled as li.list-group-item)
    // loop over current set of children in sortable list
    // jQuery's each() method will run a callback function for every item/element in the array; it's another form of looping, except that a function is now called on each loop iteration
    $(this).children().each(function () {
      // inside the callback function, $(this) actually refers to the child elements at that index; the nested $(this) refers to the task <li> element
      var text = $(this)
        .find("p")
        .text()
        .trim();

      var date = $(this)
        .find("span")
        .text()
        .trim();

      // add task data to the temp array as an object
      tempArr.push({
        text: text,
        date: date
      });

      // trim down list's ID to match object property
      var arrName = $(this)
        .attr("id")
        .replace("list-", "");

      // update array on tasks object and save
      tasks[arrName] = tempArr;
      saveTasks();

    });
  }
});

$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  // how to know which task the user wants to delete: you can't use this b/c it would simply refer to the #trash element that the event belongs to; the event.target wouldn't work either b/c #trash is also the target of the drop; drop(event, ui) --> ui variable is an object that contains a property called draggable; draggable, according to the jQuery documentation, is a jQuery object representing the draggable element
  drop: function (event, ui) {
    // removing a task from any of the lists triggers a sortable update(), meaning the sortable calls saveTasks() for us; jQuery's remove() method works just like a regular JavaScript remove()
    ui.draggable.remove();
    // when you drop task into trash the dark red color goes away and shows up as faded
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  over: function (event, ui) {
    // when you're over the trash with a task the dark red color pops out
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function (event, ui) {
    // when you're out of the trash with a task the dark red color goes away and shows up as faded
    $(".bottom-trash").removeClass("bottom-trash-active");
  }
})

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function () {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// add date picker
$("#modalDueDate").datepicker({
  // set key-value pair; minDate option with a value of 1 --> indicates how many days after the current date we want the limit to kick in; minDate of 1 allows you to pick a date starting tomorrow
  minDate: 1
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function () {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function () {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
    // saves tasks as a string after pushing tastText and taskDate into it
    // var saveTasks = function() {
    //   localStorage.setItem("tasks", JSON.stringify(tasks));
    // };
  }
});

// remove all tasks
$("#remove-tasks").on("click", function () {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();

// setInterval will run on a timed schedule based on what is entered in the second argument
// asynchronous --> they run in the background until their time is up and then execute the callback function
// here, the jQuery selector passes each element it finds using the selector into the callback function, and that element is expressed in the el argument of the function; auditTask() then passes the element to its routines using the el argument
// we loop over every task on the page with a class of list-group-item and execute the auditTask() function to check the due date of each one 
setInterval(function() {
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  });
  // set setInterval() to run every 30mins which is 1800000 milliseconds
  // (1000 * 60) * 30); --> 1,000 milliseconds * 60 to convert it to 1 minute. Then multiply by 30 to get 30mins
}, 1800000);



// setTimeout() function was given two arguments: a callback function and a number; the callback function is the block of code we want to have executed after an amount of time has passed; that amount of time comes from the second argument, which is the number of milliseconds we want to wait for
// in the setTimeout() function, we want the browser to wait 5 seconds (5,000 milliseconds) before executing a function that puts an alert dialog on the screen --> the moment that function is done running, it's done forever and won't execute again
// setTimeout will only run once
// asynchronous --> they run in the background until their time is up and then execute the callback function

              // setTimeout(function() {
              //   alert("This message happens after 5 seconds!");
              // }, 5000);
