const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const { createAdmin, createHospitalStaff, createHospital, signDonor } = require('./helpers');

const uploadsDir = path.join(__dirname, '../uploads');
const onDisk = (photoUrl) => fs.existsSync(path.join(uploadsDir, path.basename(photoUrl)));
const png = Buffer.from('89504e470d0a1a0a', 'hex');
const created = [];
const track = (photoUrl) => { if (photoUrl) created.push(path.join(uploadsDir, path.basename(photoUrl))); return photoUrl; };
afterAll(() => created.forEach((f) => { try { fs.unlinkSync(f); } catch { /* already removed */ } }));

const upload = (token) => request(app).post('/api/about/images/creator').set('Authorization', `Bearer ${token}`)
  .attach('photo', png, { filename: 'me.png', contentType: 'image/png' });

describe('About page creator photo', () => {
  test('there is no photo until an admin uploads one', async () => {
    const res = await request(app).get('/api/about');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ creatorPhoto: null, heroImage: null, purposeImage: null, sections: {} });
    expect(res.body.limits.hero).toMatchObject({ title: 60, intro: 1200 }); // rich fields report their visible-text cap
    expect(res.body.limits.stats).toEqual({ label: 60, caption: 100 });
  });

  test('an admin can upload a photo, and the public About page sees it', async () => {
    const { token } = await createAdmin();
    const res = await upload(token);
    expect(res.status).toBe(200);
    expect(track(res.body.creatorPhoto)).toMatch(/^\/uploads\/about-creator-.+\.png$/);
    expect(onDisk(res.body.creatorPhoto)).toBe(true);
    expect((await request(app).get('/api/about')).body.creatorPhoto).toBe(res.body.creatorPhoto);
  });

  test('uploading again replaces the photo and deletes the old file', async () => {
    const { token } = await createAdmin();
    const first = await upload(token);
    track(first.body.creatorPhoto);
    const second = await upload(token);
    track(second.body.creatorPhoto);
    expect(second.body.creatorPhoto).not.toBe(first.body.creatorPhoto);
    expect(onDisk(first.body.creatorPhoto)).toBe(false);
    expect(onDisk(second.body.creatorPhoto)).toBe(true);
  });

  test('DELETE removes the photo from the page and from disk', async () => {
    const { token } = await createAdmin();
    const up = await upload(token);
    track(up.body.creatorPhoto);
    const del = await request(app).delete('/api/about/images/creator').set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body.creatorPhoto).toBeNull();
    expect(onDisk(up.body.creatorPhoto)).toBe(false);
    expect((await request(app).get('/api/about')).body.creatorPhoto).toBeNull();
  });

  test('DELETE with no photo set is harmless', async () => {
    const { token } = await createAdmin();
    const del = await request(app).delete('/api/about/images/creator').set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body.creatorPhoto).toBeNull();
  });

  test('only admins can change the photo', async () => {
    expect((await upload('')).status).toBe(401);
    const donor = signDonor({ id: '64b000000000000000000001', email: 'jane@test.com' });
    expect((await upload(donor)).status).toBe(403);
    const { token } = await createHospitalStaff((await createHospital())._id);
    expect((await upload(token)).status).toBe(403);
    expect((await request(app).delete('/api/about/images/creator').set('Authorization', `Bearer ${token}`)).status).toBe(403);
  });

  test('non-image files are rejected', async () => {
    const { token } = await createAdmin();
    const res = await request(app).post('/api/about/images/creator').set('Authorization', `Bearer ${token}`)
      .attach('photo', Buffer.from('<svg/>'), { filename: 'x.svg', contentType: 'image/svg+xml' });
    expect(res.status).toBe(400);
    const missing = await request(app).post('/api/about/images/creator').set('Authorization', `Bearer ${token}`);
    expect(missing.status).toBe(400);
  });
});

describe('About page text', () => {
  const put = (token, body) => request(app).put('/api/about').set('Authorization', `Bearer ${token}`).send(body);

  test('an admin can save the page text, and the public page reads it back trimmed', async () => {
    const { token } = await createAdmin();
    const res = await put(token, { sections: {
      hero: { title: '  About  ', intro: 'Line one.\n\nLine two.' },
      stats: [{ label: 'Donors' }, { label: 'Units', caption: 'In stock' }],
    } });
    expect(res.status).toBe(200);
    const got = (await request(app).get('/api/about')).body.sections;
    expect(got.hero).toEqual({ title: 'About', intro: 'Line one.\n\nLine two.' });
    expect(got.stats).toEqual([{ label: 'Donors' }, { label: 'Units', caption: 'In stock' }]);
  });

  test('unknown sections and fields are dropped', async () => {
    const { token } = await createAdmin();
    const res = await put(token, { sections: { hero: { title: 'Hi', isAdmin: true }, evil: { x: 1 } } });
    expect(res.status).toBe(200);
    expect(res.body.sections).toEqual({ hero: { title: 'Hi' } });
  });

  test('wrong types, over-long text and too many items are refused', async () => {
    const { token } = await createAdmin();
    expect((await put(token, { sections: 'nope' })).status).toBe(400);
    expect((await put(token, { sections: { hero: { title: 5 } } })).status).toBe(400);
    expect((await put(token, { sections: { hero: { title: 'x'.repeat(61) } } })).status).toBe(400);
    expect((await put(token, { sections: { values: [{}, {}, {}, {}] } })).status).toBe(400);
    expect((await put(token, { sections: { stats: { label: 'x' } } })).status).toBe(400);
  });

  test('a formatted introduction keeps its formatting but loses anything unsafe', async () => {
    const { token } = await createAdmin();
    const intro = '<h2>Hi</h2><p><strong>Bold</strong> <em>it</em> <u>u</u><script>alert(1)</script></p>'
      + '<ul><li><p>One</p></li></ul><ol><li><p>Two</p></li></ol>'
      + '<p><a href="https://example.org" onclick="x()">ok</a> <a href="javascript:alert(1)">bad</a>'
      + '<img src=x onerror="alert(1)"><span style="color:red">s</span></p>';
    const res = await put(token, { sections: { hero: { intro } } });
    expect(res.status).toBe(200);
    const saved = res.body.sections.hero.intro;
    expect(saved).toContain('<h2>Hi</h2>');
    expect(saved).toContain('<strong>Bold</strong> <em>it</em> <u>u</u>');
    expect(saved).toContain('<ul><li><p>One</p></li></ul><ol><li><p>Two</p></li></ol>');
    expect(saved).toContain('<a href="https://example.org" target="_blank" rel="noopener noreferrer nofollow">ok</a>');
    expect(saved).not.toMatch(/script|onclick|onerror|javascript|<img|style=/i);
    expect(saved).toContain('bad'); // the unsafe link's text stays, the link does not
  });

  test('the introduction limit counts visible text, not markup', async () => {
    const { token } = await createAdmin();
    const fits = `<p><strong>${'a'.repeat(600)}</strong></p><ul><li><p>${'b'.repeat(600)}</p></li></ul>`;
    expect((await put(token, { sections: { hero: { intro: fits } } })).status).toBe(200);
    const over = `<p>${'a'.repeat(1201)}</p>`;
    expect((await put(token, { sections: { hero: { intro: over } } })).status).toBe(400);
    expect((await put(token, { sections: { hero: { intro: 'x'.repeat(1201) } } })).status).toBe(400);
    const entities = `<p>${'&amp;'.repeat(1200)}</p>`; // 1,200 visible "&"
    expect((await put(token, { sections: { hero: { intro: entities } } })).status).toBe(200);
  });

  // sanitize-html 2.17.5 has advisories that only apply when textarea, xmp or SVG are allowed;
  // this allowlist never allows them, so the payloads from those advisories must come out inert.
  test('payloads from known sanitizer advisories are neutralised', async () => {
    const { token } = await createAdmin();
    const intro = '<p>a</p><textarea></textarea/><img src=x onerror=alert(1)></textarea>'
      + '<xmp></xmp/><img src=x onerror=alert(2)></xmp>'
      + '<svg><a><animate attributeName="href" values="https://ok;javascript:alert(3)"/><text>t</text></a></svg>'
      + '<form action="javascript:alert(4)"><button formaction="javascript:alert(5)">b</button></form>';
    const res = await put(token, { sections: { hero: { intro } } });
    expect(res.status).toBe(200);
    expect(res.body.sections.hero.intro).not.toMatch(/<img|onerror|<svg|animate|javascript|<form|formaction|<textarea|<xmp/i);
  });

  test('plain-text introductions from before the editor still save unchanged', async () => {
    const { token } = await createAdmin();
    const res = await put(token, { sections: { hero: { intro: 'Tom & Jerry\n\nSecond' } } });
    expect(res.body.sections.hero.intro).toBe('Tom & Jerry\n\nSecond');
  });

  test('the team bio is a rich field too: formatting kept, unsafe markup removed, text limit', async () => {
    const { token } = await createAdmin();
    const bio = '<p><strong>Vith</strong> builds <a href="https://example.org">things</a><script>x()</script></p><ul><li><p>Next.js</p></li></ul>';
    const res = await put(token, { sections: { team: { bio } } });
    expect(res.status).toBe(200);
    expect(res.body.sections.team.bio).toBe('<p><strong>Vith</strong> builds <a href="https://example.org" target="_blank" rel="noopener noreferrer nofollow">things</a></p><ul><li><p>Next.js</p></li></ul>');
    expect((await put(token, { sections: { team: { bio: `<p>${'a'.repeat(1201)}</p>` } } })).status).toBe(400);
    expect((await put(token, { sections: { team: { bio: 'Plain bio\n\nSecond' } } })).body.sections.team.bio).toBe('Plain bio\n\nSecond');
  });

  test('an editor that only holds empty paragraphs saves as blank', async () => {
    const { token } = await createAdmin();
    const res = await put(token, { sections: { hero: { intro: '<p></p><p> </p>' } } });
    expect(res.body.sections.hero.intro).toBe('');
  });

  test('only admins can save the page text', async () => {
    expect((await put('', { sections: {} })).status).toBe(401);
    const donor = signDonor({ id: '64b000000000000000000001', email: 'jane@test.com' });
    expect((await put(donor, { sections: {} })).status).toBe(403);
    const { token } = await createHospitalStaff((await createHospital())._id);
    expect((await put(token, { sections: {} })).status).toBe(403);
  });
});

describe('About page images', () => {
  const uploadTo = (token, slot) => request(app).post(`/api/about/images/${slot}`).set('Authorization', `Bearer ${token}`)
    .attach('photo', png, { filename: 'x.png', contentType: 'image/png' });

  test('the hero and purpose images can be uploaded, replaced and removed', async () => {
    const { token } = await createAdmin();
    const hero = await uploadTo(token, 'hero');
    expect(hero.status).toBe(200);
    expect(track(hero.body.heroImage)).toMatch(/^\/uploads\/about-hero-.+\.png$/);
    const purpose = await uploadTo(token, 'purpose');
    expect(track(purpose.body.purposeImage)).toMatch(/^\/uploads\/about-purpose-.+\.png$/);

    const again = await uploadTo(token, 'hero');
    track(again.body.heroImage);
    expect(onDisk(hero.body.heroImage)).toBe(false);

    const del = await request(app).delete('/api/about/images/hero').set('Authorization', `Bearer ${token}`);
    expect(del.body).toEqual({ heroImage: null });
    expect(onDisk(again.body.heroImage)).toBe(false);
    const after = (await request(app).get('/api/about')).body;
    expect(after.heroImage).toBeNull();
    expect(after.purposeImage).toBe(purpose.body.purposeImage);
  });

  test('an unknown slot is refused without saving a file', async () => {
    const { token } = await createAdmin();
    const res = await uploadTo(token, 'secret');
    expect(res.status).toBe(404);
    expect(fs.readdirSync(uploadsDir).some((f) => f.startsWith('about-secret-'))).toBe(false);
  });

  test('only admins can change images', async () => {
    const { token } = await createHospitalStaff((await createHospital())._id);
    expect((await uploadTo(token, 'hero')).status).toBe(403);
    expect((await request(app).delete('/api/about/images/hero').set('Authorization', `Bearer ${token}`)).status).toBe(403);
  });
});
