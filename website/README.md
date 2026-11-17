# pynpro.net

PYN's website: four plain HTML pages and one stylesheet, styled like the app.

| File | Page |
| --- | --- |
| `index.html` | Home |
| `support.html` | Support: contact email and common questions |
| `privacy.html` | Privacy Policy |
| `terms.html` | Terms of Use |
| `site.css` | Colors, fonts and layout shared by every page |

No build step: open `index.html` in a browser to see it. To change text, edit
the page's HTML; to change colors or sizes, edit the variables at the top of
`site.css`. The privacy policy and terms match the drafts in Claude Docs; keep
them in step when either changes, and update "Last updated" at the top.

## Hosting option A: GitHub Pages (free, recommended)

The site goes live exactly as built, and any change pushed to GitHub is live a
minute later. Your email (info@pynpro.net) keeps working, because email uses
different DNS records than the website.

1. On GitHub, create a new public repository named `pynpro.net`.
2. Upload the five files above into it (Add file > Upload files), plus a file
   named `CNAME` containing one line: `pynpro.net`.
3. In the repository: Settings > Pages > Source: "Deploy from a branch",
   Branch: `main`, folder `/ (root)`, Save. Under Custom domain, enter
   `pynpro.net`.
4. At the company where you bought the domain, open its DNS settings and add:
   - Four `A` records for `@` pointing to `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153` and `185.199.111.153`
   - A `CNAME` record for `www` pointing to `nick676191.github.io`

   Remove any existing `A` record for `@` that points to their WordPress
   hosting. Don't touch the `MX` or `TXT` records; those run your email.
5. After DNS updates (minutes to a few hours), go back to Settings > Pages and
   tick **Enforce HTTPS**.

## Hosting option B: the WordPress hosting from your domain company

WordPress has no "upload my files" option, so each page is pasted in:

1. Install a blank page template (for example the "Blank Slate" plugin) so
   WordPress doesn't add its own header and footer around the pages.
2. Appearance > Customize > Additional CSS: paste all of `site.css`.
3. Create four pages (Home, Support, Privacy Policy, Terms of Use) with the
   blank template. In each, add a **Custom HTML** block and paste everything
   between `<body>` and `</body>` from the matching `.html` file. Put the
   `<link>` line for the Barlow Condensed font from the file's `<head>` at the
   top of each block.
4. Change the links in the header and footer from `privacy.html` and so on to
   the WordPress page addresses (for example `/privacy-policy/`), and set the
   Home page as the site's front page (Settings > Reading).

Every later change has to be pasted in again by hand, which is why option A is
easier to keep up to date.
