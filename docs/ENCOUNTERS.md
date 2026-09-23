# Encounter test guide — lab 007

The start menu offers four isolated encounters and the existing highway run. Weapons autofire; existing PC/mobile cruise, fast, brake and boost controls apply to every choice. Retry preserves the selected encounter. The header, pause screen and results screen provide a route back to selection. Practice mode remains available in Tune. Enemy models and effects are temporary code-authored primitives.

| Encounter | Mechanic | Initial tuning |
| --- | --- | --- |
| Dart squadron | Five fragile ships hold a V, warn, then form staggered columns. Clear a firing line or shoot a gap and pass. Slow nonhoming rearward shots fire left to right; killed ships leave missing beats. | 3 HP each, 23 m/s; 3 s hold, 0.8 s warning, 1.2 s formation change; 0.19 s shot spacing. |
| Interceptors | Two red rivals alternate a tracking warning, locked path, charge and recovery. Dodge after lock; the missed attack exposes the rear engine just ahead. No bullets. Passing during a clean recovery awards 150 points. | 12 HP; armor takes 20% damage, exposed rear takes 150%; 0.7 s aim + 0.65 s lock warning, independent of player speed; 0.65 s charge, 2.8 s recovery. |
| Mine layer | A fragile ship zigzags and leaves mines. Cyan partial rings mean unarmed; closed orange rings mean armed. One shot starts a delayed chain through nearby mines; blasts can damage the layer. Killing it stops new mines but leaves existing ones. | Layer 8 HP, 20 m/s; drop every 0.55 s; arm after 1.3 s; local blast radius 3.5 m, mine-to-mine chain reach 12.5 m. |
| Convoy hauler | Three independently targetable rear locks open compartments and launch cyan salvage ahead into side lanes. Escorts alternate narrow three-shot rearward bursts. All three locks remove the hull; a partial raid can still earn salvage. | Hauler 24 m/s; locks 6 HP each; escorts 5 HP; each collected salvage pickup awards 250 points. |

Cruise matches the hauler when close behind, giving time to work across the locks. Fast/boost bypass following. Interceptors pace ahead while warning so maximum speed cannot consume the reaction window. Mines have swept proximity checks at boost speed; unarmed mines allow contact without damage.

Clearing or passing an encounter brings up results after remaining relevant mines/pickups are resolved. The tests use the existing road, including narrowing and bends, with road-relative positions and bounds. They are not yet mixed into the highway ramp schedule.

Future piercing/spread weapons, ram shield, upgrade rewards, boost recharge pickups and generated 3D assets are not part of this version. Balance and visual readability are for the user's playtest. Agents perform only nonvisual validation, per `AGENTS.md`.
