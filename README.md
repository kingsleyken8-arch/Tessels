# Tessel

Concept landing page for Tessel, an AI automation studio. Plain HTML, CSS and
JavaScript with no build step.

- `index.html`, `styles.css`, `script.js`: the page, its styling, and the scroll scenes and form.
- `assets/`: backdrops and photos (generated with Higgsfield) and self-hosted fonts.

## Demo form

The form posts JSON to an n8n webhook. Paste the webhook's Production URL into
`N8N_WEBHOOK_URL` at the top of `script.js`. Each submission carries a
`submission_id` so the workflow can ignore duplicates. Until the address is set,
the form validates but sends nothing and says it is not connected.

Customer names, figures and prices on the page are placeholders.
