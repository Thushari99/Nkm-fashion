export const handleFullScreen = () => {
    const elem = document.documentElement; // This will make the entire page full screen

    if (!document.fullscreenElement) {
        // Enter full screen mode
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { // For Firefox
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { // For Chrome, Safari, and Opera
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { // For IE/Edge
            elem.msRequestFullscreen();
        }
    } else {
        // Exit full screen mode
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { // For Firefox
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { // For Chrome, Safari, and Opera
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // For IE/Edge
            document.msExitFullscreen();
        }
    }
};