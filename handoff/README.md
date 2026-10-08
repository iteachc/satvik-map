# Handoff: Telegram link preview fix for iTeachChem/iteachchem-doubts

`iteachchem-doubts-telegram-preview.patch` is one commit for the **iTeachChem/iteachchem-doubts**
repo (not this one). It moves the doubts out of index.html into threads.json so the page is
~32 KB instead of ~2.2 MB; Telegram skipped the link preview because of the size.
Tested locally (old page -> new build, second restyle, browser, offline local build).

To ship: clone iTeachChem/iteachchem-doubts, `git am` this patch onto main, push to main.
The "Restyle only" workflow then republishes the site (no Discord pull). After it's green,
re-send the link to @WebpageBot in Telegram. Then delete this handoff folder.
