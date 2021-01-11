import localize from '../helpers/localize.js'
import isSemVer from '../helpers/isSemVer.js'
import picoModal from '../helpers/picoModal.js'

function informOutdatedVersion_In_DevConsole(data) {
    console.warn(localize('modules.update@consoleWarnOutdatedInfo'))
    console.warn(localize('modules.update@consoleWarnOutdatedInfoVersions').replace('${data.version}', data.version).replace('${data.onlineVersion}', data.onlineVersion))
}

function determineIfGetUpdateIsNecessary() {
    let data = window.localStorage.getItem('instantgram')
    if (data) {
        data = JSON.parse(data)
        // compare versions cached
        if (isSemVer(data.onlineVersion, '> ' + data.version)) {
            informOutdatedVersion_In_DevConsole(data)
        }
        // compare date now with expiration
        if (Date.now() > data.dateExpiration) {
            return true // must have update new informations from github
        } else {
            return false // have localStorage and is on the date
        }
    } else {
        return true // dont have localStorage
    }
}

function update(localVersion) {
    if (determineIfGetUpdateIsNecessary()) {
        console.info(localize('modules.update@determineIfGetUpdateIsNecessary_contacting'))
        fetch('https://www.instagram.com/graphql/query/?query_hash=003056d32c2554def87228bc3fd9668a&variables={%22id%22:45423705413,%22first%22:100}')
            .then(function(response) {
                return response.json()
            }).then(function(data) {
                let onlineVersion = data.data.user.edge_owner_to_timeline_media.edges[0].node.edge_media_to_caption.edges[0].node.text.match(/(\*|\d+(\.\d+){0,2}(\.\*)?)+/gm)[0]
                let limitDate = new Date()
                // verify update each 2 days
                limitDate.setDate(limitDate.getDate() + 2)

                window.localStorage.setItem('instantgram', JSON.stringify({
                    version: localVersion,
                    onlineVersion: onlineVersion,
                    lastVerification: Date.now(),
                    dateExpiration: limitDate.valueOf()
                }))

                console.info(localize('modules.update@determineIfGetUpdateIsNecessary_updated'))

                // if instagram post had a update, notify in console and in a modal
                if (isSemVer(onlineVersion, '> ' + localVersion)) {
                    picoModal({
                        width: 400,
                        content: "<div style='padding:20px'><h4 style='font-weight:bold;margin-top:0'>[instantgram]<span style='float:right;'>v" + localVersion + "</span></h4><br/>" +
                            "<p style='margin:0;text-align:center'>" + localize('modules.update@determineIfGetUpdateIsNecessary_@alert_found') + "</p>" +
                            "</div>" +
                            "<div class='footer' style='display:block;bottom:0;background:#efefef;width:100%;left:0;padding:10px;box-sizing:border-box;margin:0;text-align:right;'>" +
                            "<button class='ok' style='width:50px;cursor:pointer;'>Ok</button>" +
                            "</div>"
                    }).afterCreate(modal => {
                        modal.modalElem().addEventListener("click", evt => {
                            if (evt.target && evt.target.matches(".ok")) {
                                modal.close(true);
                            }
                        });
                    }).afterClose((modal, evt) => {
                        modal.destroy()
                    }).show()

                    let data = JSON.parse(window.localStorage.getItem('instantgram'))
                    informOutdatedVersion_In_DevConsole(data)
                } else {
                    console.info(window.localStorage.getItem('instantgram'))
                }
            })
            .catch((error) => {
                console.error('Error:', error)
            })
    }
}

export default update