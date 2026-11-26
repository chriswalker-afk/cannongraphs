# PR18 — Advanced function framework

This is the engine milestone, not the two full advanced-world curricula. All 48 previous levels and the exact linear/quadratic engines remain unchanged. Two provisional levels demonstrate cubic/reciprocal and exponential/logarithmic/wave relays. PR19 and PR20 replace these previews with full worlds.

## Input contract

- Cubic: any supported polynomial expression that simplifies to genuine degree three, using exact rational arithmetic (expanded, factorised or translated forms).
- Reciprocal: a/(mx+c)+k, also negative-one power.
- Exponential: a*b^(mx+c)+k (b positive, b != 1), including e and exp.
- Logarithmic: a*ln(mx+c)+k or a*log(mx+c)+k; ln is natural log and log is base 10.
- Wave: a*sin(mx+c)+k, cosine or tangent; all angles in radians, pi or π accepted.

The transformed families accept constant arithmetic, implicit multiplication, brackets, affine arguments and constant scale/shift. They deliberately do not accept arbitrary sums/products of different variable-dependent functions, nested nonlinear arguments, arbitrary rational functions, or user code. Limits: 180 characters, 128 tokens, finite parameter magnitudes <= 1e6, genuine nonzero advanced scale/argument parameters >= 1e-8 in magnitude, trig frequency <= 32 rad/unit and phase <= 10000. Advanced levels use coordinates within ±1000 and x-span <=128. The polynomial parser retains its original exact arithmetic limits. Nonpolynomial values are IEEE floating-point, not symbolic exact values.

## Continuous flights

Every advanced descriptor provides value, derivative, domain predicate, next singular endpoint and interior extrema. The engine finds the earliest forward exact-coordinate capture on the connected branch, then checks preceding world boundary intersections by monotone partition/bisection and continuous solid contact. Reciprocal/log/tan asymptotes cannot be crossed; undefined or nonfinite launch values are ordinary one-Pip misfires. A numerical limit fails safely, rather than awarding an unverifiable capture. Solid contact wins a capture tie. No preflight solution preview.

For cubic and periodic waves, split at analytic derivative zeros; exponential, log, reciprocal and tangent are monotone within a branch. Endpoint boxes enclose each monotone arc. A bounded adaptive ordered search rejects disjoint boxes and refines ambiguous ones to a spatial tolerance of 1e-6 world units. Near-tangencies within tolerance can count as contact. If the search exhausts its node budget or cannot resolve a finite interval, the attempt fails safely; uncertain gem contacts do not earn rewards. This is a numerical enclosure method, not a claim of exact symbolic root isolation for transcendental functions. Authoring QA reports a conservative lower bound on clearance. The actual animated point and tangent use function evaluation; SVG traces use adaptive visual polylines (not collision geometry). Existing analytic linear/quadratic contact and Bezier traces remain intact.

Equation cards, source mismatch, trajectory feedback, repeated-failure support, gem timelines, one-Pip attempts, rapid fire and star ratings work across families. The editor supplies family-specific keys and math convention labels; nonpolynomial expressions remain in the student's editable typed form. No reference answers in the runtime catalog.

Regression tests cover the five families, safe syntax, poles in both directions, log domain, wave extrema, overflow, thin obstacles, tangency, curved gems, reference route clearance, wrong-family rejection and mixed rapid-fire scoring. Browser QA outstanding: editor controls and messages, all five families, zoom/reduced motion, long curves, and both previews. Next PR19: Contraption Factory (cubic and reciprocal teaching sequence). PR20: Beyond the Graphiverse (exponential, logarithmic, trigonometric).
