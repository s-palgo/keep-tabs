const saveTabBtn = document.getElementById("save-tab-btn");
const saveWindowBtn = document.getElementById("save-window-btn");
const seeSavedTabsBtn = document.getElementById("see-saved-tabs-btn");
const hideSavedTabsBtn = document.getElementById("hide-saved-tabs-btn");
const seeSavedWindowsBtn = document.getElementById("see-saved-windows-btn");
const tabAddedModal = document.getElementById("tab-added-modal");
const modalCloseBtnTabSuccessfullySaved = document.getElementById("modal-close-btn");
const tabAlreadyAddedModal = document.getElementById("tab-already-added-modal");
const tabAlreadyAddedModalInner = document.getElementById("modal-inner");
const modalCloseBtnTabAlreadySaved = document.getElementById("modal-close-btn-already-added");
const tabsDisplay = document.getElementById("tabs-display");
const customContextMenu = document.getElementById("custom-context-menu");
const customContextMenuOptions = customContextMenu.getElementsByClassName("custom-context-menu-option");
const changeTabTitleModal = document.getElementById("change-tab-title-modal");
const changeTabTitleInput = document.getElementById("change-tab-title-input");
const changeTabTitleSubmitBtn = document.getElementById("change-tab-title-submit-btn");

// const renderedSavedTabs = document.getElementById("saved-tabs"); 

let showingSavedTabs = true; // if this is true, then render saved tabs, else render saved windows

// This array will keep track of all saved tabs. 
let savedTabs = [];
let savedWindows = [];

// Checking to see if localStorage already has saved tabs or not.
// If it does, then we save those tabs in the local `savedTabs` array.
const savedTabsFromLocalStorage = JSON.parse(localStorage.getItem("savedTabs"))
if (savedTabsFromLocalStorage) {
    savedTabs = savedTabsFromLocalStorage;
}

saveTabBtn.addEventListener("click", function() {    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        
        if (tabAlreadySaved(currentTab)) {
            // TODO: notify user that tab is already saved by displaying modal
            let indexOfCurrentTab = getIndexOfTabInSavedTabs(currentTab);

            tabAlreadyAddedModalInner.innerHTML = `
                <h2>
                    You've already saved this tab on ${savedTabs[indexOfCurrentTab]["monthSaved"]}/${savedTabs[indexOfCurrentTab]["dateSaved"]}/${savedTabs[indexOfCurrentTab]["yearSaved"]}!
                </h2>
            `;

            tabAlreadyAddedModal.style.display = "block";
        } else {
            // add tab to savedTabs array
            addTabToSavedTabs(currentTab);

            // sort savedTabs by date saved (most recently added tabs come first)
            savedTabs.sort(compareTabsByDateSaved);

            // set savedTabs key in localStorage to the updated value of the local savedTabs array
            localStorage.setItem("savedTabs", JSON.stringify(savedTabs));

            // TODO: Add a visual which notifies that tab has been saved successfully (e.g. a modal)     
            tabAddedModal.style.display = "block";
        }
    });
});

modalCloseBtnTabSuccessfullySaved.addEventListener("click", function() {
    tabAddedModal.style.display = "none";
    removeEventListenersFromSavedTabs();
    showSavedTabs();
});

modalCloseBtnTabAlreadySaved.addEventListener("click", function() {
    tabAlreadyAddedModal.style.display = "none";
})

function addTabToSavedTabs(tab) {
    const tabUrl = tab.url;
    const tabOriginalTitle = tab.title;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDate = now.getDate();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSeconds = now.getSeconds();

    let savedTab = {};

    savedTab["url"] = tabUrl;
    savedTab["originalTitle"] = tabOriginalTitle;
    savedTab["title"] = savedTab["originalTitle"]; // title can be changed by user
    savedTab["yearSaved"] = currentYear;
    savedTab["monthSaved"] = currentMonth;
    savedTab["dateSaved"] = currentDate;
    savedTab["hourSaved"] = currentHour;
    savedTab["minuteSaved"] = currentMinute;
    savedTab["secondSaved"] = currentSeconds;

    savedTabs.push(savedTab);
}

function getIndexOfTabInSavedTabs(tab) {
    for (let i = 0; i < savedTabs.length; i++) {
        if (savedTabs[i]["url"] === tab.url) {
            return i;
        }
    }

    return -1; // if not found
}

function tabAlreadySaved(tab) {
    for (let i = 0; i < savedTabs.length; i++) {
        if (savedTabs[i]["url"] === tab.url) {
            return true;
        }
    } 

    return false;
}

// Useful function to sort an array of tabs from most recent to least recent in terms of when they were saved.
// Returns negative number if first tab was more recently saved than second tab.
// Returns positive number if first tab was less recently saved than second tab.
// Returns 0 if first tab and second tab were saved at the same time.
function compareTabsByDateSaved(tab1, tab2) {
    if (tab1["yearSaved"] !== tab2["yearSaved"]) {
        return -1 * (tab1["yearSaved"] - tab2["yearSaved"]);
    } else if (tab1["monthSaved"] !== tab2["monthSaved"]) {
        return -1 * (tab1["monthSaved"] - tab2["monthSaved"]);
    } else if (tab1["dateSaved"] !== tab2["dateSaved"]) {
        return -1 * (tab1["dateSaved"] - tab2["dateSaved"]);
    } else if (tab1["hourSaved"] !== tab2["hourSaved"]) {
        return -1 * (tab1["hourSaved"] - tab2["hourSaved"]);
    } else if (tab1["minuteSaved"] !== tab2["minuteSaved"]) {
        return -1 * (tab1["minuteSaved"] - tab2["minuteSaved"]);
    } else if (tab1["secondSaved"] !== tab2["secondSaved"]) {
        return -1 * (tab1["secondSaved"] - tab2["secondSaved"]);
    } else {
        return 0;
    }
}


saveWindowBtn.addEventListener("click", function() {
    alert("Save window button clicked with event listener");
    savedWindows.push("Window #" + (savedWindows.length + 1));
});

seeSavedTabsBtn.addEventListener("click", function() {
    // for (let i = 0; i < savedTabs.length; i++) {
    //     console.log(savedTabs[i]["title"]);
    // }
    
    showSavedTabs();
});

function showSavedTabs() {
    showingSavedTabs = true;

    renderSavedTabs();

    addEventListenersToSavedTabs();
}

hideSavedTabsBtn.addEventListener("click", function() {
    removeEventListenersFromSavedTabs();

    tabsDisplay.innerHTML = "";
});

seeSavedWindowsBtn.addEventListener("click", function() {
    showingSavedTabs = false;

    renderSavedWindows();
});

function renderSavedTabs() {
    tabsDisplay.innerHTML = "";
    
    let uniqueDates = findUniqueDates(savedTabs);
    let uniqueDatesToDisplay = makeDatesDisplayFriendly(uniqueDates);

    let allTabs = "";
    
    let uniqueDatesHaveBeenDisplayed = [];
    for (let i = 0; i < uniqueDates.length; i++) {
        uniqueDatesHaveBeenDisplayed.push(false);
    }
    let uniqueDateIndex = 0;

    for (let i = 0; i < savedTabs.length; i++) {        
        let dateTabWasAddedStr = savedTabs[i]["monthSaved"] + "/" + savedTabs[i]["dateSaved"] + "/" + savedTabs[i]["yearSaved"];

        // Adding header with new/next date, if applicable.
        if ((uniqueDates[uniqueDateIndex] === dateTabWasAddedStr) && (uniqueDatesHaveBeenDisplayed[uniqueDateIndex] === false)) {
            allTabs += `
                <h2>${uniqueDatesToDisplay[uniqueDateIndex]}</h2>
            `;

            uniqueDatesHaveBeenDisplayed[uniqueDateIndex] = true;

            if (uniqueDateIndex < (uniqueDates.length - 1)) {
                uniqueDateIndex++;
            }
        }

        allTabs += `
            <p class='tabs' id='${i}-tab'>
                <a href='${savedTabs[i]["url"]}' target='_blank' id='${i}-tab-link'>
                    ${savedTabs[i]["title"]}
                </a>
            </p>
        `;

        // console.log(allTabs);
        // console.log(savedTabs[i]["title"]);
    }

    tabsDisplay.innerHTML += allTabs;
}

// Function which turns dates into human-friendly strings.
// For example, if a date in the array matches today's date, the date will be turned into "Today".
// If a date matches yesterday's date, the date will be turned into "Yesterday".
// Otherwise, the date will be turned into a string with the name of the month, followed by the date and year.
// E.g. 3/18/2021 will be turned into "March 18th, 2021".
function makeDatesDisplayFriendly(dates) {
    // creating deep copy of dates
    let displayFriendlyDates = JSON.parse(JSON.stringify(dates));
    
    const today = new Date();
    const todaysMonth = today.getMonth() + 1;
    const todaysDate = today.getDate();
    const todaysYear = today.getFullYear();
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdaysMonth = yesterday.getMonth() + 1;
    const yesterdaysDate = yesterday.getDate();
    const yesterdaysYear = yesterday.getFullYear();
    
    const todayStr = todaysMonth + "/" + todaysDate + "/" + todaysYear;
    const yesterdayStr = yesterdaysMonth + "/" + yesterdaysDate + "/" + yesterdaysYear;

    for (let i = 0; i < dates.length; i++) {
        if (dates[i] === todayStr) {
            displayFriendlyDates[i] = "Today";
        } else if (dates[i] === yesterdayStr) {
            displayFriendlyDates[i] = "Yesterday";
        } else {
            const dateAsArr = dates[i].split("/");
            const monthName = mapNumberToMonth(parseInt(dateAsArr[0]));
            const dateWithSuffix = addSuffixToDate(parseInt(dateAsArr[1]));
            const yearStr = dateAsArr[2];

            displayFriendlyDates[i] = monthName + " " + dateWithSuffix + ", " + yearStr;
        }
    }

    return displayFriendlyDates;
    
}

function mapNumberToMonth(number) {
    if (number === 1) {
        return "January";
    } else if (number === 2) {
        return "February";
    } else if (number === 3) {
        return "March";
    } else if (number === 4) {
        return "April";
    } else if (number === 5) {
        return "May";
    } else if (number === 6) {
        return "June";
    } else if (number === 7) {
        return "July";
    } else if (number === 8) {
        return "August";
    } else if (number === 9) {
        return "September";
    } else if (number === 10) {
        return "October";
    } else if (number === 11) {
        return "November";
    } else if (number === 12) {
        return "December";
    } else {
        return null;
    }
}

// Used to add human-friendly suffix to a number representing a date.
// For example, 23 will be turned into "23rd", 15 into "15th", etc.
function addSuffixToDate(date) {
    if (((date % 10) > 3) || ((date % 10) === 0)) {
        return (date + "th");
    } else if ((date % 10) === 1) {
        if (Math.floor(date / 10) === 1) {
            return (date + "th");
        } else {
            return (date + "st");
        }
    } else if ((date % 10) === 2) {
        if (Math.floor(date / 10) === 1) {
            return (date + "th");
        } else {
            return (date + "nd");
        }
    } else if ((date % 10) === 3) {
        if (Math.floor(date / 10) === 1) {
            return (date + "th");
        } else {
            return (date + "rd");
        }
    }
}

// function displayCustomContextMenu(e, tabIndexInSavedTabs) {
//     console.log("entering event listener for contextmenu");
    
//     e.preventDefault();
//     customContextMenu.style.display = "none";

//     // TODO: Display custom context menu
//     customContextMenu.style.display = "block";

//     // TODO: Add event listeners here for each of the buttons in the context menu
//     customContextMenuOptions[0].addEventListener("click", function() {
//         window.open(savedTabs[tabIndexInSavedTabs]["url"], "_blank");
//     });
    
//     customContextMenuOptions[1].addEventListener("click", function() {
//         window.open(savedTabs[tabIndexInSavedTabs]["url"]);    
//     });

//     customContextMenuOptions[2].addEventListener("click", function() {
//         console.log("entering event listener for click on 3rd option in menu");


//         changeTabTitleModal.style.display = "block";

//         changeTabTitleSubmitBtn.addEventListener("click", function() {
//             console.log("new title entered");


//             // NOTE FOR TOMORROW: 
//             // FIGURE OUT WHY BUTTON IS BEING 'CLICKED' MULTIPLE TIMES EVEN THOUGHT I ONLY CLICK IT ONCE

//             // Every time the submit button is clicked,
//             // it's looping through all the pages I've 
//             // tried renaming.  


            
//             const newTitle = changeTabTitleInput.value;
//             changeTabTitleInput.value = "";
//             changeTabTitleModal.style.display = "none";
            
//             console.log("value of newTitle: " + newTitle);
            
//             savedTabs[tabIndexInSavedTabs]["title"] = newTitle;
//             console.log(JSON.stringify(savedTabs[tabIndexInSavedTabs]));
            
//             console.log("savedTabs[tabIndexInSavedTabs][title]: " + savedTabs[tabIndexInSavedTabs]["title"]);
//             localStorage.setItem("savedTabs", JSON.stringify(savedTabs));

//             // let modalInnerHTMLBeforeAddingSuccessMessage = changeTabTitleModal.innerHTML;

//             // console.log("innerHTML of modal: " + modalInnerHTMLBeforeAddingSuccessMessage);

//             // changeTabTitleModal.innerHTML += `
//             //     <h3>Title added!</h3>
//             // `;


//             // setTimeout(function() {
//             //     // changeTabTitleModal.innerHTML = modalInnerHTMLBeforeAddingSuccessMessage;
//             //     changeTabTitleModal.style.display = "none";
//             // }, 3000);

//             showSavedTabs();
//             changeTabTitleSubmitBtn.unbind("click");
//         });    
//     });

//     customContextMenuOptions[3].addEventListener("click", function() {
//         savedTabs[tabIndexInSavedTabs]["title"] = savedTabs[tabIndexInSavedTabs]["originalTitle"];
//         localStorage.setItem("savedTabs", JSON.stringify(savedTabs));
//         showSavedTabs();
//     });

// }

// Every time saved tabs are displayed, event listeners will be 
// added to each tab. The listeners will listen for a "contextmenu"
// event. If the event happens (i.e. if the user right-clicks a 
// tab in order to see its context menu), the context menu will be 
// displayed.
function addEventListenersToSavedTabs() {
    const allTabsByClassName = tabsDisplay.getElementsByClassName("tabs");

    // for (let i = 0; i < allTabsByClassName.length; i++) {
    //     allTabsByClassName[i].addEventListener("contextmenu", function(e) {
    //         displayCustomContextMenu(e, i);
    //     });
    // }

    for (let i = 0; i < allTabsByClassName.length; i++) {
        console.log("Added an event listener");
        allTabsByClassName[i].addEventListener("contextmenu", displayCustomContextMenu);
    }
}

// Every time the display of saved tabs is removed (even if temporarily),
// the event listeners from the tabs are removed as well. 
function removeEventListenersFromSavedTabs() {
    const allTabsByClassName = tabsDisplay.getElementsByClassName("tabs");
    // for (let i = 0; i < allTabsByClassName.length; i++) {
    //     allTabsByClassName[i].removeEventListener("contextmenu", function(e) {
    //         displayCustomContextMenu(e, i);
    //     });
    // }

    for (let i = 0; i < allTabsByClassName.length; i++) {
        console.log("Removed an event listener");
        allTabsByClassName[i].removeEventListener("contextmenu", displayCustomContextMenu);
    }
}

function displayCustomContextMenu(e) {
    e.preventDefault();

    let tabElementThatTriggeredEvent = e.target; // one of the displayed tabs

    // console.log(tabElementThatTriggeredEvent);

    let idOfElementThatTriggeredEvent = tabElementThatTriggeredEvent.id;

    let tabIndexInSavedTabs = parseInt(idOfElementThatTriggeredEvent);    
    
    
    customContextMenu.style.display = "none";

    // TODO: Display custom context menu
    customContextMenu.style.display = "block";


    // Finding correct left and top values to position context menu. 
    let mouseXCoordinate = e.clientX;
    let mouseYCoordinate = e.clientY;
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let contextMenuWidth = customContextMenu.clientWidth;
    let contextMenuHeight = customContextMenu.clientHeight;
    
    // console.log("Mouse x coordinate: " + mouseXCoordinate);
    // console.log("Mouse y coordinate: " + mouseYCoordinate);
    // console.log("Width of context menu: " + contextMenuWidth);
    // console.log("Height of context menu: " + contextMenuHeight);
    // console.log("Window width: " + windowWidth);
    // console.log("Window height: " + windowHeight);

    
    // let mouseLeftPosition = e.pageX; 
    // let mouseTopPosition = e.pageY;
    // let windowWidth = window.width();
    // let windowHeight = window.innerHeight;
    // let contextMenuWidth = customContextMenu.outerWidth();
    // let contextMenuHeight = customContextMenu.outerHeight();

    if ((mouseXCoordinate + contextMenuWidth) > windowWidth) {
        if ((mouseXCoordinate - contextMenuWidth) >= 0) {
            customContextMenu.style.left = (mouseXCoordinate - contextMenuWidth) + "px";
        } else {
            customContextMenu.style.left = "0px";
        }
    } else {
        customContextMenu.style.left = mouseXCoordinate + "px";
    }

    if ((mouseYCoordinate + contextMenuHeight) > windowHeight) {
        if ((mouseYCoordinate - contextMenuHeight) >= 0) {
            customContextMenu.style.top = (mouseYCoordinate - contextMenuHeight) + "px";
        } else {
            customContextMenu.style.left = "0px";
        }    } else {
        customContextMenu.style.top = mouseYCoordinate + "px";
    }

    // console.log("Custom context menu left position: " + customContextMenu.style.left);
    // console.log("Custom context menu top position: " + customContextMenu.style.top);


    // x = x > windowWidth - contextMenuWidth ? windowWidth - contextMenuWidth : x;
    // y = y > windowHeight - contextMenuHeight ? windowHeight - contextMenuHeight : y;

    // let leftPosition = mouseLeftPosition;
    // let topPosition = mouseTopPosition;

    // if (leftPosition > (windowWidth - contextMenuWidth)) {
    //     leftPosition = windowWidth - contextMenuWidth;
    // }

    // if (topPosition > (windowHeight - contextMenuHeight)) {
    //     topPosition = windowHeight - contextMenuHeight;
    // }

    // customContextMenu.style.left = x + "px";
    // customContextMenu.style.top = y + "px";

    

    // Add event listeners here for each of the buttons in the context menu
    const customContextMenuFirstOption = customContextMenuOptions[0];
    customContextMenuFirstOption.id = tabIndexInSavedTabs + "-open-in-new-tab";
    customContextMenuFirstOption.addEventListener("click", openLinkInNewTab);
    
    const customContextMenuSecondOption = customContextMenuOptions[1];
    customContextMenuSecondOption.id = tabIndexInSavedTabs + "-open-in-new-window";
    customContextMenuSecondOption.addEventListener("click", openLinkInNewWindow);

    const customContextMenuThirdOption = customContextMenuOptions[2];
    customContextMenuThirdOption.id = tabIndexInSavedTabs + "-rename-title";
    customContextMenuThirdOption.addEventListener("click", renameTab);

    const customContextMenuFourthOption = customContextMenuOptions[3];
    customContextMenuFourthOption.id = tabIndexInSavedTabs + "-revert-title-to-original";
    customContextMenuFourthOption.addEventListener("click", revertTitleToOriginal);

    // Hide context menu if user clicks somewhere on the page outside of menu
    document.addEventListener("click", function() {
        customContextMenuFirstOption.removeEventListener("click", openLinkInNewTab);
        customContextMenuSecondOption.removeEventListener("click", openLinkInNewWindow);
        customContextMenuThirdOption.removeEventListener("click", renameTab);
        customContextMenuFourthOption.removeEventListener("click", revertTitleToOriginal);

        customContextMenu.style.display = "none";
    });
}

function openLinkInNewTab(e) {
    const elementThatTriggeredEvent = e.target; // customContextMenuThirdOption
    let idOfElementThatTriggeredEvent = elementThatTriggeredEvent.id;
    let tabIndexInSavedTabs = parseInt(idOfElementThatTriggeredEvent);
    
    window.open(savedTabs[tabIndexInSavedTabs]["url"], "_blank");

    elementThatTriggeredEvent.removeEventListener("click", openLinkInNewTab);

    customContextMenu.style.display = "none";
}

function openLinkInNewWindow(e) {
    const elementThatTriggeredEvent = e.target; // customContextMenuThirdOption
    let idOfElementThatTriggeredEvent = elementThatTriggeredEvent.id;
    let tabIndexInSavedTabs = parseInt(idOfElementThatTriggeredEvent);
    elementThatTriggeredEvent.removeEventListener("click", openLinkInNewWindow);
    
    chrome.windows.create({
        url: savedTabs[tabIndexInSavedTabs]["url"]
    });

    customContextMenu.style.display = "none";
}

function renameTab(e) {
    const elementThatTriggeredEvent = e.target; // customContextMenuThirdOption
    let idOfElementThatTriggeredEvent = elementThatTriggeredEvent.id;
    
    // console.log("3rd option in context menu clicked");

    changeTabTitleSubmitBtn.id = idOfElementThatTriggeredEvent + "-btn";

    // console.log("ID of submit btn: " + changeTabTitleSubmitBtn.id);

    changeTabTitleModal.style.display = "block";

    changeTabTitleSubmitBtn.addEventListener("click", captureAndSaveNewTabTitle);

    customContextMenu.style.display = "none";
    
    elementThatTriggeredEvent.removeEventListener("click", renameTab);
}

function captureAndSaveNewTabTitle(e) {
    const elementThatTriggeredEvent = e.target; // changeTabTitleSubmitBtn

    console.log(elementThatTriggeredEvent);
    
    let idOfElementThatTriggeredEvent = elementThatTriggeredEvent.id;

    let tabIndexInSavedTabs = parseInt(idOfElementThatTriggeredEvent);

    const newTitle = changeTabTitleInput.value;
    changeTabTitleInput.value = "";
    changeTabTitleModal.style.display = "none";
    
    // console.log("value of newTitle: " + newTitle);
    
    savedTabs[tabIndexInSavedTabs]["title"] = newTitle;
    // console.log(JSON.stringify(savedTabs[tabIndexInSavedTabs]));
    
    // console.log("savedTabs[tabIndexInSavedTabs][title]: " + savedTabs[tabIndexInSavedTabs]["title"]);
    localStorage.setItem("savedTabs", JSON.stringify(savedTabs));

    // let modalInnerHTMLBeforeAddingSuccessMessage = changeTabTitleModal.innerHTML;

    // console.log("innerHTML of modal: " + modalInnerHTMLBeforeAddingSuccessMessage);

    // changeTabTitleModal.innerHTML += `
    //     <h3>Title added!</h3>
    // `;


    // setTimeout(function() {
    //     // changeTabTitleModal.innerHTML = modalInnerHTMLBeforeAddingSuccessMessage;
    //     changeTabTitleModal.style.display = "none";
    // }, 3000);

    // changeTabTitleSubmitBtn.unbind("click");

    removeEventListenersFromSavedTabs();
    showSavedTabs();

    changeTabTitleSubmitBtn.removeEventListener("click", captureAndSaveNewTabTitle);
}

function revertTitleToOriginal(e) {
    const elementThatTriggeredEvent = e.target;

    console.log(elementThatTriggeredEvent);

    let idOfElementThatTriggeredEvent = elementThatTriggeredEvent.id;

    let tabIndexInSavedTabs = parseInt(idOfElementThatTriggeredEvent);

    savedTabs[tabIndexInSavedTabs]["title"] = savedTabs[tabIndexInSavedTabs]["originalTitle"];
    localStorage.setItem("savedTabs", JSON.stringify(savedTabs));
    
    removeEventListenersFromSavedTabs();
    showSavedTabs();

    elementThatTriggeredEvent.removeEventListener("click", revertTitleToOriginal);

    customContextMenu.style.display = "none";
}


// getEventListeners(domElement)

function findUniqueDates(arr) {
    let arrOfUniqueDates = [];

    if (arr.length === 0) {
        return arrOfUniqueDates;
    } else {
        let firstElementYearSaved = arr[0]["yearSaved"];
        let firstElementMonthSaved = arr[0]["monthSaved"];
        let firstElementDateSaved = arr[0]["dateSaved"];
        
        let firstElementDate = firstElementMonthSaved + "/" + firstElementDateSaved + "/" + firstElementYearSaved;
        arrOfUniqueDates.push(firstElementDate);

        for (let i = 1; i < arr.length; i++) {
            let elemYearSaved = arr[i]["yearSaved"];
            let elemMonthSaved = arr[i]["monthSaved"];
            let elemDateSaved = arr[i]["dateSaved"];

            let elemDate = elemMonthSaved + "/" + elemDateSaved + "/" + elemYearSaved;

            let elemDateIsUnique = true;

            for (let j = 0; j < arrOfUniqueDates.length; j++) {
                if (elemDate === arrOfUniqueDates[j]) {
                    elemDateIsUnique = false;
                    break;
                }
            }

            if (elemDateIsUnique) {
                arrOfUniqueDates.push(elemDate);
            }
        }
        return arrOfUniqueDates;
    }

}

function renderSavedWindows() {
    chrome.tabs.create({
        url: "saved-tabs-windows.html"
    });
}