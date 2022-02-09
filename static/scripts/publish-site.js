/* global roamAlphaAPI, fetch, document */
(function() {
  let clickTimer = null;

  async function clickHandler(e) {
    clearTimeout(clickTimer);

    // Button actions
    const htmlTarget = e.target;
    const name =
      htmlTarget &&
      htmlTarget.tagName === 'BUTTON' &&
      htmlTarget.innerText.toLowerCase().trim();
    if (name === 'publish') {
      htmlTarget.textContent = 'Publishing...';

      let res = roamAlphaAPI.q(
        '[:find (?str ...) :where [_ :block/string ?str] [(clojure.string/includes? ?str "Publish target::")]]'
      );
      let m = res.length > 0 ? res[0].match(/::\s*(.*)/) : null;
      let site = m && m[1];
      if (site == null) {
        htmlTarget.textContent = 'No publish target found';
      } else {
        console.log('Publishing to', site);
        let res = await fetch(`https://${site}/_fan`, { method: 'POST' }).catch(
          err => {
            console.log('ERR', err);
          }
        );

        if (res.status === 200) {
          htmlTarget.textContent = 'Success!';
        } else {
          htmlTarget.textContent = 'Error';
        }
      }

      setTimeout(() => {
        htmlTarget.textContent = 'PUBLISH';
      }, 5000);
    }
  }

  document.addEventListener('click', clickHandler, true);
})();
