# C1 ivory menu

Selected concept: `menu-c1-ivory-racing.png`.

The menu uses ivory lettering and primary buttons, graphite panels, a cyan checkpoint accent, and checker details. Course mode has been removed from the menu; races use the phase rules. Pause and results share the palette.

Controls live in a separate native dialog, accessible from the menu and pause screen. The initial page follows the primary pointer type (PC or touch), with a manual switch. Keyboard focus and Escape use native dialog behavior.

The Race button doubles as the loading indicator: its fill and percentage follow asset preparation, with 100% reserved for actual readiness. While loading it is disabled; when ready it becomes the solid ivory Race button. The former separate loading caption is screen-reader-only.

Pause, crash and checkpoint panels use the same numbered tabs, large italic ivory headings, checker accents, graphite insets and chamfered buttons. Results show one short cause or next-course line plus distance and time. Long retry explanations and lesson paragraphs have been removed from results. Desktop retry shortcuts appear inside the action button.

The menu backdrop is the existing rendered course. A separate presentation pose moves through clear stretches of the loaded checkpoint, fades between shots, and loops. It does not step race physics, modify progress, or submit scores. It shares the active scene and assets rather than generating a second level. Reduced-motion preferences hold the preview still. Race starts the normal simulation from the selected checkpoint.

The performance toggle and F8 require `dev=1`; add `perf=1` to open the panel immediately. Normal URLs hide developer controls.

Validation: source review and production build only. Gameplay and appearance testing belong to the user.
