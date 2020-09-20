




function onLoad(){

    const domain = 'meet.jit.si';
    const options = {
        roomName: 'HelloWorld123',
        width: 700,
        height: 700,
        parentNode: document.querySelector("#jitsi"),
        interfaceConfigOverwrite: { 
            filmStripOnly: false,
            enableWelcomePage: false,
            disableInviteFunctions: true,
            prejoinPageEnabled: false,


         },
    };

    const api = new JitsiMeetExternalAPI(domain, options);
}


