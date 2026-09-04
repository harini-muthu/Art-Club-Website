# Gallery Review States Design

## Goal

Make the officer gallery review experience distinguish work awaiting a decision from published work, and make optional member details truly optional.

## Officer dashboard

The Gallery submissions page will render two sections, newest first within each section.

### Needs review

This section contains pending, rejected, and changes-needed submissions. Each row keeps the existing preview, artwork metadata, optional statement, review-note field, and approval controls. Officers can approve, request changes, reject, or delete a submission.

### Published artwork

This section contains approved submissions. It is deliberately compact: thumbnail, title, artist, and published status. It has no review note or decision controls. The only action is Delete.

Approved work remains visible in the public gallery until deletion. Deleting it removes its private and public files and its submission record.

## Feedback and confirmation

After approving, the page displays: `Artwork approved and published.` After deleting, it displays: `Artwork deleted.`

Deleting any artwork asks: `Are you sure you want to delete this artwork?`

## Member submission form

Dimensions and artist statement are optional fields. The server accepts blank values and retains empty strings. The officer review and public gallery omit those details when no value was supplied.

## Tests

- Validation accepts a form with no dimensions or statement.
- The needs-review list excludes approved work, while the published list contains only approved work.
- Approved rows have Delete only and use the exact confirmation message.
- Status messages render for approved and deleted redirects.
