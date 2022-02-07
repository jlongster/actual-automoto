(function() {
    if (window.__githubSyncObserver) {
	window.__githubSyncObserver.disconnect();
    }
    if (window.__githubSyncClickHandler) {
	console.log('removing')
	document.removeEventListener('click', window.__githubSyncClickHandler, true)
    }

    let targetNode = document.querySelector('.roam-main');

    function notify(msg, { error } = {}) {
	let notifContainer = document.querySelector('#github-sync-notifications');
	if(notifContainer == null) {
	    notifContainer = document.createElement('div');
	    notifContainer.id = 'github-sync-notifications'
	    Object.assign(notifContainer.style, {
		position: 'fixed',
		right: 0,
		bottom: 0,
		margin: '20px',
	    })
	    document.body.appendChild(notifContainer)
	}

	let notif = document.createElement('div');
	Object.assign(notif.style, {
	    padding: '10px',
	    borderRadius: '6px',
	    backgroundColor: error ? '#FECACA' : '#F3F4F6',
	    boxShadow: '0 0 #0000, 0 0 #0000,  0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
	    maxWidth: '350px',
	    color: error ? '#7F1D1D' :'#1F2937',
	    marginTop: '15px'
	})
	notif.textContent = msg;

	setTimeout(() => {
	    notif.remove()
	}, 2500)
	
	notifContainer.appendChild(notif);
    }

    function getEditedBlockId(nodes) {
	let edited = null;
	for (let node of nodes) {
	    if (edited == null) {
		edited =
		    node.nodeName === '#text'
		    ? null
		    : node.matches('.rm-autocomplete__wrapper')
		    ? node
		    : node.querySelector('.rm-autocomplete__wrapper');
	    } else {
		break;
	    }
	}

	if(edited) {
	    let textarea = edited.querySelector('textarea');
	    return getBlockId(textarea)
	}

	return edited;
    }

    function getCheckbox(nodes) {
	for (let node of nodes) {
	    let checkbox =
		node.nodeName !== '#text' &&
		node.querySelector('.check-container input');
	    if (checkbox) {
		return checkbox;
	    }
	}
	return null;
    }

    function getBlockId(block) {
	return block.id.slice(-9);
    }

    function first(result) {
	return result.length > 0 ? result[0][0] : null;
    }

    function getBlockString(blockId) {
	return first(
	    roamAlphaAPI.q(
		`[:find ?s :where [?b :block/uid "${blockId}"] [?b :block/string ?s]]`
	    )
	);
    }

    function getEntityId(blockId) {
	let str = getBlockString(blockId);

	let m = str.match(/\(issue: (\d+)\)/);
	if (m == null) {
	    return null;
	}

	return m[1];
    }

    function getEntity(blockId) {
	let str = getBlockString(blockId);

	let m = str.match(/}}(.*)\(issue: (\d+)\)/);
	if (m == null) {
	    return null;
	}

	let id = m[2];
	let title = m[1].trim();
	let tags = roamAlphaAPI.q(
	    `[:find ?t :where [?e :block/uid "${blockId}"] [?e :block/refs ?v] [?v :node/title ?t]]`
	);

	return {
	    id,
	    title,
	    labels: tags.map(t => t[0]).filter(t => t !== 'TODO' && t !== 'DONE' && t !== 'unsynced'),
	    state: str.indexOf('[[DONE]]') !== -1 ? 'closed' : 'open',
	    _str: str,
	    _blockId: blockId
	};
    }

    function markUnsyncedIfIssue(blockId) {
	let str = getBlockString(blockId);

	let m = str.match(/}}(.*)\(issue: (\d+)\)/);
	if (m == null) {
	    return false;
	}

	if(str.indexOf('#unsynced') === -1) {
	    roamAlphaAPI.updateBlock({
		block: { uid: blockId, string: `${str} #unsynced` }
	    })
	}

	return true;
    }

    function serverFetch(issue, action) {
	if(action === 'update' && issue.id == null) {
	    notify('Attempted to update issue without an id', { error: true })
	    return;
	}
	
	return fetch(
            'https://discord-life.jlongster.com/roam-push-aa81ff3c-bda3-442e-a0ee-98c442754f2b',
            {
		method: 'POST',
		body: JSON.stringify({
		    secret: 'd2dc4d41-be4b-4859-8ead-3e9e8d99e128',
		    issue: action === 'update' ? issue.id : null,
		    fields: {
			title: issue.title,
			labels: issue.labels,
			state: issue.state
		    }
		}),
		headers: {
		    'Content-Type': 'application/json'
		}
            }
	).then(res => {
	    if(res.status !== 200) {
		throw new Error("Request failed")
	    }
	})
    }

    function findParentRoamBlock(node) {
	while (node) {
	    if (node.matches('.roam-block')) {
		return node;
	    }
	    node = node.parentNode;
	}
    }

    let recentlyClicked = false;
    let clickTimer = null;
    
    function onChange(mutationsList, observer) {
	for (let mutation of mutationsList) {
	    if (mutation.type === 'childList') {
		let target = mutation.target;
		
		// Editing a block
		if (mutation.removedNodes.length > 0) {
		    let id;
		    if ((id = getEditedBlockId(mutation.removedNodes))) {
			markUnsyncedIfIssue(id);
		    }
		}

		// Checkbox
		if (mutation.addedNodes.length > 0) {
		    let node;
		    if (target.tagName === 'SPAN' && (node = getCheckbox(mutation.addedNodes))) {
			if(recentlyClicked) {
			    let id = getBlockId(findParentRoamBlock(target));
			    markUnsyncedIfIssue(id);
			}
		    }
		}
            }
	}
    }

    let observer = new MutationObserver(onChange);
    observer.observe(targetNode, { attributes: false, childList: true, subtree: true });

    // Click
    async function clickHandler(e) {
	clearTimeout(clickTimer);
	
	recentlyClicked = true;
	clickTimer = setTimeout(() => {
	    recentlyClicked = false
	}, 100)

	// Button actions
	const htmlTarget = e.target;
	const name = htmlTarget &&
	      htmlTarget.tagName === "BUTTON" &&
	      htmlTarget.innerText
	      .toLowerCase()
	      .trim()
	if (name === 'sync') {
	    let res = roamAlphaAPI.q(`
              [:find ?uid :where [?b :block/refs ?refs] [?refs :node/title "unsynced"] [?b :block/uid ?uid]]
            `)

	    let issues = res.map(r => getEntity(r[0]))

	    let successCount = 0;
	    let errorCount = 0;

	    await Promise.all(issues.map(issue => {
		return serverFetch(issue, 'update').then(() => {
		    successCount++

		    roamAlphaAPI.updateBlock({
			block: {
			    uid: issue._blockId,
			    string: issue._str.replace('#unsynced', '').trim()
			}
		    })
		}, err => {
		    errorCount++;
		})
	    }))

	    if(successCount > 0) {
		notify(`Updated ${successCount} issues`)
	    }
	    if(errorCount > 0) {
		notify(`Error updating ${errorCount} issues`, { error: true })
	    }
	}
	else if(name === 'bug') {
	    let button = htmlTarget;
	    let block = button.closest(".roam-block");
	    let blockId = block && getBlockId(block);

	    if(blockId) {
		let str = getBlockString(blockId);
		// Remove all tags, references, and actions
		str = str.replace(/\{\{[^}]*\}\}\W*/g, '')
                    .replace(/\[\[[^\]]*\]\]\W*/g, '')
                    .replace(/#\w+\W*/g, '').trim()
		serverFetch({ title: str }).then(() => {
		    notify(`Created issue: "${str}"`)
		    window.roamAlphaAPI.deleteBlock({ block: { uid: blockId }});
		}).catch(err => {
		    notify('Error creating issue', { error: true })
		})
								
	    }
	}
    }

    
    document.addEventListener("click", clickHandler, true)

    console.log('Observing changes to github issues...')

    window.__githubSyncObserver = observer;
    window.__githubSyncClickHandler = clickHandler;
})();
