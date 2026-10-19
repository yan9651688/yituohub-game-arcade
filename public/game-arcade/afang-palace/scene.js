
        import * as THREE from 'three';
        import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
        import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
        import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
        import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
        import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

        const bootStarted = performance.now();
        const reportProgress = (stage, progress) => window.dispatchEvent(new CustomEvent('afang:progress', { detail: { stage, progress } }));
        reportProgress('geometry', 0.1);
        await new Promise(resolve => requestAnimationFrame(resolve));

        // ==========================================
        // 本地三维场景；音乐由 music.js 的单个 HTMLAudioElement 播放。
        // ==========================================
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1218);
        scene.fog = new THREE.FogExp2(0x28181f, 0.00085);

        const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 1.0, 3000);

        const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.shadowMap.autoUpdate = false;
        renderer.shadowMap.needsUpdate = true;
        renderer.info.autoReset = false;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.12;
        document.body.appendChild(renderer.domElement);

        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(Math.floor(window.innerWidth / 2), Math.floor(window.innerHeight / 2)),
            0.25, 0.52, 0.88
        );
        composer.addPass(bloomPass);
        composer.addPass(new OutputPass());

        const qualityProfiles = {
            high: { pixelRatio: 1.5, pixels: 2600000, fps: 60, shadowHz: 15, bloomScale: 1 },
            balanced: { pixelRatio: 1.2, pixels: 1300000, fps: 40, shadowHz: 8, bloomScale: 0.75 },
            low: { pixelRatio: 1, pixels: 700000, fps: 30, shadowHz: 4, bloomScale: 0.5 }
        };
        let qualityChoice = 'auto';
        let effectiveQuality = matchMedia('(pointer: coarse)').matches ? 'balanced' : 'high';
        try {
            const storedQuality = localStorage.getItem('afang-palace.quality');
            if (storedQuality === 'auto' || qualityProfiles[storedQuality]) qualityChoice = storedQuality;
        } catch (_) { /* Storage is optional. */ }
        if (qualityChoice !== 'auto') effectiveQuality = qualityChoice;
        function resizeRendering() {
            const width = Math.max(1, window.innerWidth), height = Math.max(1, window.innerHeight);
            const profile = qualityProfiles[effectiveQuality];
            const ratio = Math.min(window.devicePixelRatio || 1, profile.pixelRatio, Math.sqrt(profile.pixels / (width * height)));
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setPixelRatio(ratio);
            renderer.setSize(width, height);
            composer.setPixelRatio(ratio);
            composer.setSize(width, height);
            // Keep the gold glow; reduce only its offscreen blur resolution in lighter modes.
            bloomPass.setSize(width * ratio * profile.bloomScale, height * ratio * profile.bloomScale);
            renderer.shadowMap.needsUpdate = true;
        }
        function setQuality(value) {
            if (value !== 'auto' && !qualityProfiles[value]) return;
            qualityChoice = value;
            effectiveQuality = value === 'auto' ? (matchMedia('(pointer: coarse)').matches ? 'balanced' : 'high') : value;
            try { localStorage.setItem('afang-palace.quality', value); } catch (_) { /* Optional. */ }
            resizeRendering();
            window.dispatchEvent(new CustomEvent('afang:qualitychange', { detail: { quality: qualityChoice, effectiveQuality } }));
        }
        resizeRendering();

        // ==========================================
        // 2. 丝滑镜头过渡 + WASD 漫游 + 空气墙
        // ==========================================
        const moveState = {
            forward: false, backward: false,
            left: false, right: false,
            up: false, down: false,
            sprint: false
        };
        let autoOrbit = false;
        let orbitAngle = 0;
        let orbitCenter = new THREE.Vector3(0, 11, 20);
        let isPointerDown = false;
        let lastPointerX = 0, lastPointerY = 0;
        const camEuler = new THREE.Euler(0, 0, 0, 'YXZ');

        const camTransition = {
            active: false,
            startPos: new THREE.Vector3(),
            endPos: new THREE.Vector3(),
            startQuat: new THREE.Quaternion(),
            endQuat: new THREE.Quaternion(),
            progress: 0,
            duration: 1.4
        };

        function flyToCameraPose(px, py, pz, lookX, lookY, lookZ, instant = false) {
            orbitCenter.set(lookX, lookY, lookZ);
            orbitAngle = Math.atan2(px - lookX, pz - lookZ);
            if (instant) {
                camera.position.set(px, py, pz);
                camera.lookAt(lookX, lookY, lookZ);
                camEuler.setFromQuaternion(camera.quaternion);
                camTransition.active = false;
                return;
            }
            camTransition.startPos.copy(camera.position);
            camTransition.endPos.set(px, py, pz);
            camTransition.startQuat.copy(camera.quaternion);

            const dummyCam = camera.clone();
            dummyCam.position.set(px, py, pz);
            dummyCam.lookAt(lookX, lookY, lookZ);
            camTransition.endQuat.copy(dummyCam.quaternion);
            camTransition.progress = 0;
            camTransition.active = true;
        }

        // 初始镜头：直接聚焦于修正朝向后的「十二金人」与大秦五丈旗御道
        flyToCameraPose(0, 7.5, 86, 0, 11, 20, true);

        function stopAutoModesOnUserAction() {
            camTransition.active = false;
            if (autoOrbit) {
                autoOrbit = false;
                document.getElementById('btn-rotate').classList.remove('active');
                document.getElementById('btn-rotate').setAttribute('aria-pressed', 'false');
            }
        }

        window.addEventListener('keydown', e => {
            if (e.target.closest?.('input, select, textarea, button, summary, a[href], [contenteditable="true"]')) return;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
            switch (e.code) {
                case 'KeyW': case 'ArrowUp':    moveState.forward = true;  stopAutoModesOnUserAction(); break;
                case 'KeyS': case 'ArrowDown':  moveState.backward = true; stopAutoModesOnUserAction(); break;
                case 'KeyA': case 'ArrowLeft':  moveState.left = true;     stopAutoModesOnUserAction(); break;
                case 'KeyD': case 'ArrowRight': moveState.right = true;    stopAutoModesOnUserAction(); break;
                case 'KeyE': case 'Space':      moveState.up = true;       stopAutoModesOnUserAction(); break;
                case 'KeyQ': case 'KeyC':       moveState.down = true;     stopAutoModesOnUserAction(); break;
                case 'ShiftLeft': case 'ShiftRight': moveState.sprint = true; break;
            }
        });

        window.addEventListener('keyup', e => {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp':    moveState.forward = false; break;
                case 'KeyS': case 'ArrowDown':  moveState.backward = false; break;
                case 'KeyA': case 'ArrowLeft':  moveState.left = false; break;
                case 'KeyD': case 'ArrowRight': moveState.right = false; break;
                case 'KeyE': case 'Space':      moveState.up = false; break;
                case 'KeyQ': case 'KeyC':       moveState.down = false; break;
                case 'ShiftLeft': case 'ShiftRight': moveState.sprint = false; break;
            }
        });

        const dom = renderer.domElement;
        dom.style.touchAction = 'none';
        let lookPointerId = null;
        dom.addEventListener('contextmenu', e => e.preventDefault());
        dom.addEventListener('pointerdown', e => {
            if (lookPointerId !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
            lookPointerId = e.pointerId;
            dom.setPointerCapture(e.pointerId);
            isPointerDown = true;
            lastPointerX = e.clientX;
            lastPointerY = e.clientY;
            stopAutoModesOnUserAction();
        });
        function releaseLook(e) {
            if (e && lookPointerId !== e.pointerId) return;
            isPointerDown = false;
            if (lookPointerId !== null && dom.hasPointerCapture(lookPointerId)) dom.releasePointerCapture(lookPointerId);
            lookPointerId = null;
        }
        window.addEventListener('pointerup', releaseLook);
        window.addEventListener('pointercancel', releaseLook);
        dom.addEventListener('lostpointercapture', releaseLook);
        function releaseMovement() {
            Object.keys(moveState).forEach(key => moveState[key] = false);
            releaseLook();
        }
        window.addEventListener('blur', releaseMovement);
        function setMove(direction, active) {
            if (!Object.hasOwn(moveState, direction)) return;
            moveState[direction] = Boolean(active);
            if (active) stopAutoModesOnUserAction();
        }
        window.addEventListener('pointermove', e => {
            if (!isPointerDown || e.pointerId !== lookPointerId) return;
            const dx = e.clientX - lastPointerX;
            const dy = e.clientY - lastPointerY;
            lastPointerX = e.clientX;
            lastPointerY = e.clientY;

            camEuler.y -= dx * 0.003;
            camEuler.x -= dy * 0.003;
            camEuler.x = THREE.MathUtils.clamp(camEuler.x, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
            camera.quaternion.setFromEuler(camEuler);
        });

        dom.addEventListener('wheel', e => {
            e.preventDefault();
            stopAutoModesOnUserAction();
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            camera.position.addScaledVector(forward, -e.deltaY * 0.04);
            applyAirWallConstraints();
        }, { passive: false });

        function getMinGroundHeightAt(x, z) {
            if (Math.abs(x) < 48 && z > -50 && z < -2) return 17.5;
            if (Math.abs(x) < 56 && z >= -2 && z < 8)  return 12.5;
            if (Math.abs(x) < 64 && z >= 8  && z < 20) return 7.5;
            if (Math.abs(x) < 24 && z > -148 && z < -108) return 13.5;
            return 2.0;
        }

        function applyAirWallConstraints() {
            camera.position.x = THREE.MathUtils.clamp(camera.position.x, -188.0, 188.0);
            camera.position.z = THREE.MathUtils.clamp(camera.position.z, -165.0, 198.0);
            const minH = getMinGroundHeightAt(camera.position.x, camera.position.z);
            camera.position.y = THREE.MathUtils.clamp(camera.position.y, minH, 90.0);
        }

        // ==========================================
        // 3. 全景大气天穹背景 (流霞、晴云与银河星汉)
        // ==========================================
        function createSkyDomeTexture(mode) {
            const c = document.createElement('canvas');
            c.width = 1024; c.height = 512;
            const ctx = c.getContext('2d');

            const grad = ctx.createLinearGradient(0, 0, 0, 512);
            if (mode === 'sunset') {
                grad.addColorStop(0.0,  '#090c18');
                grad.addColorStop(0.28, '#1f162b');
                grad.addColorStop(0.44, '#5e2832');
                grad.addColorStop(0.51, '#b85a2c');
                grad.addColorStop(0.56, '#f2a649');
                grad.addColorStop(0.62, '#28181f');
                grad.addColorStop(1.0,  '#120c10');
            } else if (mode === 'noon') {
                grad.addColorStop(0.0,  '#1c4e8f');
                grad.addColorStop(0.32, '#4682b4');
                grad.addColorStop(0.50, '#8ec3eb');
                grad.addColorStop(0.56, '#cbe4f5');
                grad.addColorStop(0.62, '#7d9db8');
                grad.addColorStop(1.0,  '#3a4a58');
            } else {
                grad.addColorStop(0.0,  '#02040a');
                grad.addColorStop(0.30, '#071124');
                grad.addColorStop(0.50, '#122544');
                grad.addColorStop(0.56, '#1b3358');
                grad.addColorStop(0.62, '#090e1c');
                grad.addColorStop(1.0,  '#04060c');
            }
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1024, 512);

            if (mode === 'sunset') {
                const sunG = ctx.createRadialGradient(740, 252, 4, 740, 252, 120);
                sunG.addColorStop(0.0, 'rgba(255, 248, 200, 1.0)');
                sunG.addColorStop(0.15, 'rgba(255, 190, 80, 0.85)');
                sunG.addColorStop(0.45, 'rgba(235, 95, 45, 0.35)');
                sunG.addColorStop(1.0, 'rgba(180, 40, 40, 0.0)');
                ctx.fillStyle = sunG;
                ctx.fillRect(600, 130, 280, 250);

                for (let i = 0; i < 65; i++) {
                    const cx = Math.random() * 1024;
                    const cy = 140 + Math.random() * 125;
                    const rw = 30 + Math.random() * 90;
                    const rh = 4 + Math.random() * 13;
                    const cg = ctx.createRadialGradient(cx, cy, 1, cx, cy, rw);
                    const isLow = cy > 215;
                    cg.addColorStop(0, isLow ? 'rgba(255, 185, 95, 0.22)' : 'rgba(190, 95, 110, 0.16)');
                    cg.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = cg;
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (mode === 'noon') {
                for (let i = 0; i < 75; i++) {
                    const cx = Math.random() * 1024;
                    const cy = 110 + Math.random() * 145;
                    const rw = 35 + Math.random() * 100;
                    const rh = 6 + Math.random() * 18;
                    const cg = ctx.createRadialGradient(cx, cy, 2, cx, cy, rw);
                    cg.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
                    cg.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
                    ctx.fillStyle = cg;
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                ctx.save();
                ctx.translate(512, 130);
                ctx.rotate(-0.22);
                const mwG = ctx.createRadialGradient(0, 0, 10, 0, 0, 380);
                mwG.addColorStop(0.0, 'rgba(130, 175, 240, 0.22)');
                mwG.addColorStop(0.4, 'rgba(85, 125, 195, 0.12)');
                mwG.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = mwG;
                ctx.beginPath();
                ctx.ellipse(0, 0, 450, 70, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                const moonG = ctx.createRadialGradient(310, 170, 3, 310, 170, 65);
                moonG.addColorStop(0.0, 'rgba(245, 250, 255, 0.98)');
                moonG.addColorStop(0.14, 'rgba(200, 225, 255, 0.65)');
                moonG.addColorStop(0.45, 'rgba(110, 155, 220, 0.18)');
                moonG.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = moonG;
                ctx.beginPath();
                ctx.arc(310, 170, 65, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = 'rgba(210, 230, 255, 0.45)';
                for (let s = 0; s < 240; s++) {
                    const sx = Math.random() * 1024;
                    const sy = Math.random() * 220;
                    const sr = Math.random() * 0.9 + 0.3;
                    ctx.beginPath();
                    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            const tex = new THREE.CanvasTexture(c);
            tex.colorSpace = THREE.SRGBColorSpace;
            return tex;
        }

        const skyTextures = {
            sunset: createSkyDomeTexture('sunset'),
            noon:   createSkyDomeTexture('noon'),
            night:  createSkyDomeTexture('night')
        };

        const skyDomeMat = new THREE.MeshBasicMaterial({
            map: skyTextures.sunset,
            side: THREE.BackSide,
            fog: false,
            depthWrite: false
        });
        const skyDome = new THREE.Mesh(new THREE.SphereGeometry(1650, 40, 20), skyDomeMat);
        scene.add(skyDome);

        // ==========================================
        // 4. 程序化古建与山水 PBR 纹理库（含考据修正版大秦玄黑皂游旌旗）
        // ==========================================
        function createStoneTex(rx = 8, ry = 8, baseHex = '#323035') {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');
            ctx.fillStyle = baseHex;
            ctx.fillRect(0, 0, 256, 256);
            for (let i = 0; i < 180; i++) {
                ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)';
                ctx.fillRect(Math.random() * 256, Math.random() * 256, Math.random() * 18 + 2, Math.random() * 10 + 2);
            }
            ctx.strokeStyle = 'rgba(15, 14, 18, 0.45)';
            ctx.lineWidth = 1.5;
            for (let y = 0; y < 256; y += 32) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
                const off = (y / 32) % 2 === 0 ? 0 : 32;
                for (let x = off; x < 256; x += 64) {
                    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 32); ctx.stroke();
                }
            }
            const tex = new THREE.CanvasTexture(c);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(rx, ry);
            return tex;
        }

        function createMagnetiteInlayTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#2d3746';
            ctx.fillRect(0, 0, 256, 256);
            ctx.strokeStyle = '#e5b248';
            ctx.lineWidth = 4;
            ctx.strokeRect(8, 8, 240, 240);
            ctx.strokeRect(16, 90, 224, 76);
            ctx.strokeStyle = 'rgba(85, 195, 255, 0.45)';
            ctx.lineWidth = 2;
            for (let x = 32; x < 230; x += 32) {
                ctx.strokeRect(x - 9, 100, 18, 56);
            }
            const tex = new THREE.CanvasTexture(c);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(2, 2);
            return tex;
        }

        function createQinTileRoofTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#1a1d24';
            ctx.fillRect(0, 0, 256, 256);
            for (let x = 0; x < 256; x += 8) {
                ctx.fillStyle = (x / 8) % 2 === 0 ? '#12151a' : '#2a2f3a';
                ctx.fillRect(x, 0, 4, 256);
            }
            ctx.fillStyle = '#d9a336';
            ctx.fillRect(0, 244, 256, 12);
            const tex = new THREE.CanvasTexture(c);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(4, 2);
            return tex;
        }

        function createQinBeamTex() {
            const c = document.createElement('canvas');
            c.width = 512; c.height = 128;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#181313';
            ctx.fillRect(0, 0, 512, 128);
            ctx.strokeStyle = '#9e201b';
            ctx.lineWidth = 7;
            ctx.strokeRect(4, 4, 504, 120);
            ctx.strokeStyle = '#e5b248';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(12, 12, 488, 104);
            for (let x = 32; x < 490; x += 64) {
                ctx.strokeRect(x - 18, 26, 36, 76);
                ctx.beginPath(); ctx.arc(x, 64, 11, 0, Math.PI * 2); ctx.stroke();
            }
            const tex = new THREE.CanvasTexture(c);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(4, 1);
            return tex;
        }

        function createPlaqueTex(text) {
            const c = document.createElement('canvas');
            c.width = 512; c.height = 256;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#120d0c';
            ctx.fillRect(0, 0, 512, 256);
            ctx.strokeStyle = '#e5b248';
            ctx.lineWidth = 14;
            ctx.strokeRect(10, 10, 492, 236);
            ctx.lineWidth = 4;
            ctx.strokeRect(24, 24, 464, 208);
            ctx.fillStyle = '#f7d586';
            ctx.font = 'bold 82px "KaiTi", "STKaiti", "Songti SC", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(255, 195, 70, 0.7)';
            ctx.shadowBlur = 10;
            ctx.fillText(text, 256, 130);
            return new THREE.CanvasTexture(c);
        }

        // 【考据级重绘】大秦玄黑皂游旌旗贴图：废除“玄鸟龙章”四字楷书，改绘先秦错金云雷纹边、双夔龙凤鸟图腾圆徽、纯矢量小篆「秦」字与三旒燕尾分叉旗脚
        function createBannerTex() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 512;
            const ctx = c.getContext('2d');
            ctx.clearRect(0, 0, 256, 512);

            // 1) 绘制先秦三旒燕尾旗身轮廓（底部三道分叉旗旒）
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(256, 0);
            ctx.lineTo(256, 512);
            ctx.lineTo(214, 430);
            ctx.lineTo(172, 512);
            ctx.lineTo(128, 425);
            ctx.lineTo(84, 512);
            ctx.lineTo(42, 430);
            ctx.lineTo(0, 512);
            ctx.closePath();
            ctx.fillStyle = '#121015'; // 秦尚水德，旌旗皆尚玄黑（皂游）
            ctx.fill();

            // 2) 丹朱与错金云雷几何纹外框
            ctx.strokeStyle = '#b01e18';
            ctx.lineWidth = 14;
            ctx.strokeRect(10, 10, 236, 405);
            ctx.strokeStyle = '#ebb848';
            ctx.lineWidth = 4;
            ctx.strokeRect(22, 22, 212, 381);

            // 两侧秦式回纹/云雷纹装饰格
            ctx.lineWidth = 2.5;
            for (let y = 36; y < 380; y += 36) {
                ctx.strokeRect(28, y, 16, 22);
                ctx.strokeRect(212, y, 16, 22);
            }

            // 3) 上方绘：秦代错金蟠螭/玄鸟圆璧纹章
            ctx.save();
            ctx.translate(128, 125);
            ctx.strokeStyle = '#f2c355';
            ctx.lineWidth = 4.5;
            ctx.beginPath(); ctx.arc(0, 0, 62, 0, Math.PI * 2); ctx.stroke();
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, 52, 0, Math.PI * 2); ctx.stroke();

            // 对称玄鸟展翼与双夔龙卷尾几何图腾
            for (let s of [-1, 1]) {
                ctx.save();
                ctx.scale(s, 1);
                ctx.beginPath();
                ctx.moveTo(0, -38);
                ctx.bezierCurveTo(28, -36, 46, -12, 40, 18);
                ctx.bezierCurveTo(32, 38, 12, 44, 0, 32);
                ctx.stroke();
                // 羽翼三道金翎
                for (let w = 0; w < 3; w++) {
                    ctx.beginPath();
                    ctx.moveTo(14 + w * 7, -14 + w * 8);
                    ctx.lineTo(38 - w * 3, -4 + w * 11);
                    ctx.stroke();
                }
                ctx.restore();
            }
            ctx.restore();

            // 4) 下方绘：纯几何笔道构造的秦代【小篆「秦」字】（双手奉杵击禾之形，完全符合秦刻石小篆笔意）
            ctx.save();
            ctx.translate(128, 305);
            ctx.strokeStyle = '#f5ca62';
            ctx.lineWidth = 6.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // 上部：三横与中竖贯顶（春/奉字头小篆弧线）
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath();
                ctx.arc(0, -45 + i * 16, 34 - Math.abs(i) * 4, Math.PI * 1.15, Math.PI * 1.85);
                ctx.stroke();
            }
            // 中轴贯通竖笔与左右对称披撇（小篆修长垂脚）
            ctx.beginPath();
            ctx.moveTo(0, -78);
            ctx.lineTo(0, 68);
            ctx.moveTo(-24, -12);
            ctx.quadraticCurveTo(-36, 26, -46, 52);
            ctx.moveTo(24, -12);
            ctx.quadraticCurveTo(36, 26, 46, 52);
            // 下部「禾」字篆体对称弧笔
            ctx.moveTo(-28, 14);
            ctx.lineTo(28, 14);
            ctx.moveTo(0, 24);
            ctx.quadraticCurveTo(-18, 48, -26, 66);
            ctx.moveTo(0, 24);
            ctx.quadraticCurveTo(18, 48, 26, 66);
            ctx.stroke();
            ctx.restore();

            const tex = new THREE.CanvasTexture(c);
            tex.colorSpace = THREE.SRGBColorSpace;
            return tex;
        }

        const darkStoneTex = createStoneTex(6, 3, '#3a383e');
        const rammedEarthTex = createStoneTex(10, 2, '#5e4d3c');
        const plazaStoneTex = createStoneTex(48, 48, '#28272b');
        const roofRibTex = createQinTileRoofTexture();
        const qinBeamTex = createQinBeamTex();
        const bannerTex = createBannerTex();
        const magnetiteTex = createMagnetiteInlayTexture();

        // ==========================================
        // 5. PBR 材质库
        // ==========================================
        const matQinBlackTile = new THREE.MeshStandardMaterial({ color: 0x20232a, roughness: 0.36, metalness: 0.22 });
        const matQinRibbedRoof = new THREE.MeshStandardMaterial({
            map: roofRibTex, bumpMap: roofRibTex, bumpScale: 0.08, roughness: 0.38, metalness: 0.20
        });
        const matQinGoldGlaze = new THREE.MeshStandardMaterial({ color: 0xdfb244, roughness: 0.30, metalness: 0.55 });
        const matCinnabarPillar = new THREE.MeshStandardMaterial({ color: 0x981d1a, roughness: 0.38, metalness: 0.06 });
        const matPalaceWall = new THREE.MeshStandardMaterial({ color: 0x6e1a16, roughness: 0.68, metalness: 0.04 });
        const matEbonyWood = new THREE.MeshStandardMaterial({ color: 0x221a17, roughness: 0.52, metalness: 0.08 });
        const matRammedEarth = new THREE.MeshStandardMaterial({
            map: rammedEarthTex, bumpMap: rammedEarthTex, bumpScale: 0.06, roughness: 0.75, metalness: 0.04
        });
        const matDarkStone = new THREE.MeshStandardMaterial({
            map: darkStoneTex, bumpMap: darkStoneTex, bumpScale: 0.05, roughness: 0.55, metalness: 0.10
        });
        const matWhiteJade = new THREE.MeshStandardMaterial({ color: 0xe6e2d8, roughness: 0.45, metalness: 0.05 });
        const matPlaza = new THREE.MeshStandardMaterial({
            map: plazaStoneTex, bumpMap: plazaStoneTex, bumpScale: 0.025, roughness: 0.80, metalness: 0.05
        });
        const matQinBeam = new THREE.MeshStandardMaterial({ map: qinBeamTex, roughness: 0.42, metalness: 0.20 });
        const matGoldenColossus = new THREE.MeshStandardMaterial({ color: 0xefc04c, roughness: 0.26, metalness: 0.76 });
        const matAncientBronze = new THREE.MeshStandardMaterial({ color: 0x856a3c, roughness: 0.36, metalness: 0.68 });
        const matMagnetite = new THREE.MeshStandardMaterial({
            map: magnetiteTex, bumpMap: magnetiteTex, bumpScale: 0.08,
            color: 0x465468, emissive: 0x102538, emissiveIntensity: 0.35, roughness: 0.38, metalness: 0.38
        });
        const matMagneticVein = new THREE.MeshStandardMaterial({
            color: 0x66d9ff, emissive: 0x2299ee, emissiveIntensity: 1.1, roughness: 0.25
        });
        const matWindowGlow = new THREE.MeshStandardMaterial({
            color: 0xfff0d0, emissive: 0xff922b, emissiveIntensity: 0.75, roughness: 0.85
        });
        const matFireGlow = new THREE.MeshStandardMaterial({
            color: 0xff5500, emissive: 0xff4400, emissiveIntensity: 1.8, roughness: 0.3
        });
        const matSilkCurtain = new THREE.MeshStandardMaterial({
            color: 0xc82424, emissive: 0x4a0c0c, roughness: 0.5,
            transparent: true, opacity: 0.82, side: THREE.DoubleSide
        });
        // 开启 alphaTest 裁切出三旒燕尾分叉旗脚
        const matBanner = new THREE.MeshStandardMaterial({
            map: bannerTex, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6
        });
        const matWater = new THREE.MeshStandardMaterial({ color: 0x0c3b44, roughness: 0.14, metalness: 0.42 });
        const matWillowGreen = new THREE.MeshStandardMaterial({ color: 0x2d5e36, roughness: 0.75 });
        const matLotusLeaf = new THREE.MeshStandardMaterial({ color: 0x246234, roughness: 0.65, side: THREE.DoubleSide });
        const matLotusPetal = new THREE.MeshStandardMaterial({ color: 0xf7a8b8, emissive: 0x421220, roughness: 0.38 });
        const matKoiRed = new THREE.MeshStandardMaterial({ color: 0xff3b1f, emissive: 0x661500, roughness: 0.25 });
        const matKoiGold = new THREE.MeshStandardMaterial({ color: 0xffb82b, emissive: 0x553300, roughness: 0.25 });

        const masterGroup = new THREE.Group();
        scene.add(masterGroup);
        const dummy = new THREE.Object3D();

        // ==========================================
        // 6. 全局 GPU 硬件实例化池
        // ==========================================
        const MAX_BLACK_TILES = 28000;
        const MAX_GOLD_TILES = 5500;
        const MAX_PILLARS = 4500;
        const MAX_DOUGONG = 4800;
        const MAX_POSTS = 3500;
        const MAX_LOTUS_LEAVES = 500;
        const MAX_LOTUS_FLOWERS = 200;
        const MAX_KOI = 64;

        const tileGeo = new THREE.CylinderGeometry(0.09, 0.095, 0.52, 7);
        tileGeo.rotateX(Math.PI / 2);
        const instBlackTiles = new THREE.InstancedMesh(tileGeo, matQinBlackTile, MAX_BLACK_TILES);
        const instGoldTiles = new THREE.InstancedMesh(tileGeo, matQinGoldGlaze, MAX_GOLD_TILES);
        instBlackTiles.receiveShadow = true;

        const pillarGeo = new THREE.CylinderGeometry(0.92, 1.0, 1.0, 12);
        const instPillars = new THREE.InstancedMesh(pillarGeo, matCinnabarPillar, MAX_PILLARS);
        instPillars.castShadow = true; instPillars.receiveShadow = true;

        const plinthGeo = new THREE.BoxGeometry(2.3, 0.32, 2.3);
        const instPlinths = new THREE.InstancedMesh(plinthGeo, matAncientBronze, MAX_PILLARS);

        const dgBlockGeo = new THREE.BoxGeometry(1.1, 0.42, 1.1);
        const instDougong = new THREE.InstancedMesh(dgBlockGeo, matEbonyWood, MAX_DOUGONG);
        const dgGoldGeo = new THREE.BoxGeometry(0.22, 0.16, 1.55);
        const instDougongGold = new THREE.InstancedMesh(dgGoldGeo, matGoldenColossus, MAX_DOUGONG);

        const stonePostGeo = new THREE.BoxGeometry(0.34, 1.25, 0.34);
        const instStonePosts = new THREE.InstancedMesh(stonePostGeo, matDarkStone, MAX_POSTS);

        const leafGeo = new THREE.CircleGeometry(0.62, 12, 0, Math.PI * 1.92);
        leafGeo.rotateX(-Math.PI / 2);
        const instLotusLeaves = new THREE.InstancedMesh(leafGeo, matLotusLeaf, MAX_LOTUS_LEAVES);
        instLotusLeaves.receiveShadow = true;

        const flowerGeo = new THREE.ConeGeometry(0.26, 0.32, 7);
        flowerGeo.rotateX(Math.PI);
        const instLotusFlowers = new THREE.InstancedMesh(flowerGeo, matLotusPetal, MAX_LOTUS_FLOWERS);

        const koiGeo = new THREE.ConeGeometry(0.14, 0.65, 6);
        koiGeo.rotateX(Math.PI / 2);
        const instKoiRed = new THREE.InstancedMesh(koiGeo, matKoiRed, MAX_KOI);
        const instKoiGold = new THREE.InstancedMesh(koiGeo, matKoiGold, MAX_KOI);

        let blackTileCount = 0, goldTileCount = 0, pillarCount = 0, dgCount = 0, postCount = 0;
        let lotusLeafCount = 0, lotusFlowerCount = 0, koiRedCount = 0, koiGoldCount = 0;
        const koiSwimmers = [];

        function addInstPillar(x, yBottom, z, height, radius) {
            if (pillarCount >= MAX_PILLARS || height <= 0.05) return;
            dummy.position.set(x, yBottom + 0.16, z);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(radius, 1, radius);
            dummy.updateMatrix();
            instPlinths.setMatrixAt(pillarCount, dummy.matrix);

            dummy.position.set(x, yBottom + height / 2, z);
            dummy.scale.set(radius, height, radius);
            dummy.updateMatrix();
            instPillars.setMatrixAt(pillarCount++, dummy.matrix);
        }

        function addInstDougong(x, y, z, rotY = 0, scale = 1.0) {
            if (dgCount >= MAX_DOUGONG) return;
            dummy.position.set(x, y + 0.21 * scale, z);
            dummy.rotation.set(0, rotY, 0);
            dummy.scale.setScalar(scale);
            dummy.updateMatrix();
            instDougong.setMatrixAt(dgCount, dummy.matrix);

            dummy.position.set(x + Math.sin(rotY) * 0.22 * scale, y + 0.32 * scale, z + Math.cos(rotY) * 0.22 * scale);
            dummy.rotation.set(0.22, rotY, 0);
            dummy.updateMatrix();
            instDougongGold.setMatrixAt(dgCount++, dummy.matrix);
        }

        function addInstStonePost(x, y, z, scaleY = 1.0) {
            if (postCount >= MAX_POSTS) return;
            dummy.position.set(x, y + 0.625 * scaleY, z);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, scaleY, 1);
            dummy.updateMatrix();
            instStonePosts.setMatrixAt(postCount++, dummy.matrix);
        }

        function populateLotusAndKoiPatch(cx, cz, spanX, spanZ, leafNum, koiNum) {
            for (let i = 0; i < leafNum; i++) {
                if (lotusLeafCount >= MAX_LOTUS_LEAVES) break;
                const lx = cx + (Math.random() - 0.5) * spanX;
                const lz = cz + (Math.random() - 0.5) * spanZ;
                const s = 0.65 + Math.random() * 0.85;
                dummy.position.set(lx, 0.13 + (i % 5) * 0.005, lz);
                dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
                dummy.scale.set(s, 1, s);
                dummy.updateMatrix();
                instLotusLeaves.setMatrixAt(lotusLeafCount++, dummy.matrix);

                if (i % 3 === 0 && lotusFlowerCount < MAX_LOTUS_FLOWERS) {
                    const fx = lx + (Math.random() - 0.5) * 0.3;
                    const fz = lz + (Math.random() - 0.5) * 0.3;
                    const fs = 0.8 + Math.random() * 0.5;
                    dummy.position.set(fx, 0.26, fz);
                    dummy.rotation.set(Math.PI, Math.random() * Math.PI, 0);
                    dummy.scale.set(fs, fs, fs);
                    dummy.updateMatrix();
                    instLotusFlowers.setMatrixAt(lotusFlowerCount++, dummy.matrix);
                }
            }

            for (let k = 0; k < koiNum; k++) {
                const isRed = k % 2 === 0;
                const idx = isRed ? koiRedCount++ : koiGoldCount++;
                if (idx >= MAX_KOI) continue;
                koiSwimmers.push({
                    isRed, idx,
                    cx: cx + (Math.random() - 0.5) * (spanX * 0.6),
                    cz: cz + (Math.random() - 0.5) * (spanZ * 0.6),
                    rx: 2.2 + Math.random() * 3.5,
                    rz: 1.8 + Math.random() * 3.0,
                    speed: 0.45 + Math.random() * 0.35,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }

        // ==========================================
        // 7. 秦式屋顶、模块殿宇基础组件
        // ==========================================
        function buildQinHipRoof(cx, yBase, cz, eaveW, eaveD, ridgeW, ridgeD, roofH, isTopRoof = true, highPolyTiles = false, tileStep = 0.68) {
            const rg = new THREE.Group();
            rg.position.set(cx, yBase, cz);
            const halfWe = eaveW / 2, halfDe = eaveD / 2;
            const halfWr = ridgeW / 2, halfDr = ridgeD / 2;

            function getPt(u, v, sIn, sOut, dIn, dOut) {
                const hs = THREE.MathUtils.lerp(sIn, sOut, v);
                const zd = THREE.MathUtils.lerp(dIn, dOut, v);
                const flare = 1 + 0.035 * Math.pow(Math.abs(u), 3) * Math.pow(v, 1.5);
                return new THREE.Vector3(
                    u * hs * flare,
                    roofH * Math.pow(1 - v, 1.22) + 0.38 * Math.pow(Math.abs(u), 3.2) * Math.pow(v, 1.8),
                    zd * flare
                );
            }

            function makeSlopeMesh(isSide, signDir) {
                const segU = 16, segV = 8;
                const geo = new THREE.BufferGeometry();
                const pos = [], uvs = [], idx = [];
                for (let iv = 0; iv <= segV; iv++) {
                    const v = iv / segV;
                    for (let iu = 0; iu <= segU; iu++) {
                        const u = (iu / segU) * 2 - 1;
                        const p = !isSide ? getPt(u, v, halfWr, halfWe, halfDr, halfDe) : getPt(u, v, halfDr, halfDe, halfWr, halfWe);
                        if (highPolyTiles) p.y -= 0.06;
                        if (isSide) pos.push(p.z * signDir, p.y, p.x * (-signDir));
                        else pos.push(p.x * signDir, p.y, p.z * signDir);
                        uvs.push((u + 1) * 0.5 * (isSide ? eaveD : eaveW) * 0.15, v);
                    }
                }
                for (let iv = 0; iv < segV; iv++) {
                    for (let iu = 0; iu < segU; iu++) {
                        const a = iv * (segU + 1) + iu, b = a + 1, c = a + (segU + 1), d = c + 1;
                        idx.push(a, c, b, b, c, d);
                    }
                }
                geo.setIndex(idx);
                geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
                geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
                geo.computeVertexNormals();
                const m = new THREE.Mesh(geo, highPolyTiles ? matEbonyWood : matQinRibbedRoof);
                m.castShadow = true; m.receiveShadow = true;
                return m;
            }
            rg.add(makeSlopeMesh(false, 1), makeSlopeMesh(false, -1), makeSlopeMesh(true, 1), makeSlopeMesh(true, -1));

            if (highPolyTiles) {
                const rows = Math.max(7, Math.floor(Math.hypot(halfDe - halfDr, roofH) / 0.52));
                function populateTiles(sIn, sOut, dIn, dOut, isSide, signDir) {
                    const cols = Math.floor((sOut * 2) / tileStep);
                    for (let ic = 0; ic <= cols; ic++) {
                        const wc = -sOut + ic * tileStep;
                        for (let ir = 0; ir < rows; ir++) {
                            const v1 = ir / rows, v2 = (ir + 1) / rows;
                            const allow = THREE.MathUtils.lerp(sIn, sOut, (v1 + v2) * 0.5);
                            if (Math.abs(wc) > allow - 0.15) continue;

                            const u1 = wc / Math.max(0.01, THREE.MathUtils.lerp(sIn, sOut, v1));
                            const u2 = wc / Math.max(0.01, THREE.MathUtils.lerp(sIn, sOut, v2));
                            const p1 = getPt(THREE.MathUtils.clamp(u1, -1, 1), v1, sIn, sOut, dIn, dOut);
                            const p2 = getPt(THREE.MathUtils.clamp(u2, -1, 1), v2, sIn, sOut, dIn, dOut);

                            if (isSide) {
                                p1.set(p1.z * signDir, p1.y, p1.x * (-signDir));
                                p2.set(p2.z * signDir, p2.y, p2.x * (-signDir));
                            } else if (signDir < 0) {
                                p1.x *= -1; p1.z *= -1; p2.x *= -1; p2.z *= -1;
                            }
                            p1.add(rg.position); p2.add(rg.position);
                            dummy.position.lerpVectors(p1, p2, 0.5);
                            dummy.scale.set(1, 1, p1.distanceTo(p2) / 0.48);
                            dummy.lookAt(p2);
                            dummy.updateMatrix();

                            if (ir === rows - 1) {
                                if (goldTileCount < MAX_GOLD_TILES) instGoldTiles.setMatrixAt(goldTileCount++, dummy.matrix);
                            } else {
                                if (blackTileCount < MAX_BLACK_TILES) instBlackTiles.setMatrixAt(blackTileCount++, dummy.matrix);
                            }
                        }
                    }
                }
                populateTiles(halfWr, halfWe, halfDr, halfDe, false, 1);
                populateTiles(halfWr, halfWe, halfDr, halfDe, false, -1);
                populateTiles(halfDr, halfDe, halfWr, halfWe, true, 1);
                populateTiles(halfDr, halfDe, halfWr, halfWe, true, -1);
            }

            for (let sx of [-1, 1]) {
                for (let sz of [-1, 1]) {
                    const pts = [];
                    for (let iv = 0; iv <= 5; iv++) {
                        const p = getPt(sx, iv / 5, halfWr, halfWe, halfDr, halfDe);
                        p.z *= sz; p.y += 0.08; pts.push(p);
                    }
                    const curve = new THREE.CatmullRomCurve3(pts);
                    rg.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.15, 6, false), matQinGoldGlaze));
                }
            }

            if (isTopRoof && ridgeW > 0.6) {
                const mainRidge = new THREE.Mesh(new THREE.BoxGeometry(ridgeW + 0.6, 0.55, 0.45), matQinBlackTile);
                mainRidge.position.set(0, roofH + 0.22, 0);
                const goldCrest = new THREE.Mesh(new THREE.BoxGeometry(ridgeW + 0.8, 0.20, 0.50), matGoldenColossus);
                goldCrest.position.set(0, roofH + 0.52, 0);
                rg.add(mainRidge, goldCrest);

                for (let side of [-1, 1]) {
                    const chiwei = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.35, 0.65), matGoldenColossus);
                    chiwei.position.set(side * (halfWr + 0.15), roofH + 0.65, 0);
                    chiwei.rotation.z = -side * 0.18;
                    rg.add(chiwei);
                }
            } else if (isTopRoof && ridgeW <= 0.6) {
                const spire = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.8, 10), matGoldenColossus);
                spire.position.set(0, roofH + 0.8, 0);
                rg.add(spire);
            }

            masterGroup.add(rg);
        }

        function buildModularQinHall(cx, yBase, cz, w, d, h, eaveExt, roofH, upperW = 0, upperD = 0, plaqueText = null, highPoly = false) {
            const hallGroup = new THREE.Group();
            hallGroup.position.set(cx, yBase, cz);

            const coreW = w - 2.4, coreD = d - 2.4;
            const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(coreW, h, coreD), matPalaceWall);
            wallMesh.position.y = h / 2;
            wallMesh.castShadow = true; wallMesh.receiveShadow = true;
            hallGroup.add(wallMesh);

            const winMeshF = new THREE.Mesh(new THREE.BoxGeometry(coreW * 0.76, h * 0.55, 0.22), matWindowGlow);
            winMeshF.position.set(0, h * 0.52, coreD / 2 + 0.06);
            const winMeshB = winMeshF.clone();
            winMeshB.position.z = -coreD / 2 - 0.06;
            hallGroup.add(winMeshF, winMeshB);

            const numX = Math.max(2, Math.round(w / 3.6));
            const numZ = Math.max(2, Math.round(d / 3.6));
            for (let ix = 0; ix <= numX; ix++) {
                const px = -w / 2 + (w / numX) * ix;
                for (let iz = 0; iz <= numZ; iz++) {
                    if (ix === 0 || ix === numX || iz === 0 || iz === numZ) {
                        const pz = -d / 2 + (d / numZ) * iz;
                        addInstPillar(cx + px, yBase, cz + pz, h, 0.34);
                    }
                }
            }

            const beamFB = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.52, 0.42), matQinBeam);
            for (let sz of [-d / 2, d / 2]) {
                const b = beamFB.clone(); b.position.set(0, h - 0.28, sz);
                hallGroup.add(b);
            }
            const beamLR = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, d + 0.4), matQinBeam);
            for (let sx of [-w / 2, w / 2]) {
                const b = beamLR.clone(); b.position.set(sx, h - 0.28, 0);
                hallGroup.add(b);
            }

            const dgCountX = Math.max(3, Math.floor(w / 2.4));
            const dgCountZ = Math.max(2, Math.floor(d / 2.4));
            for (let i = 0; i <= dgCountX; i++) {
                const dx = -w / 2 + (w / dgCountX) * i;
                addInstDougong(cx + dx, yBase + h, cz + d / 2, 0);
                addInstDougong(cx + dx, yBase + h, cz - d / 2, Math.PI);
            }
            for (let j = 1; j < dgCountZ; j++) {
                const dz = -d / 2 + (d / dgCountZ) * j;
                addInstDougong(cx + w / 2, yBase + h, cz + dz, Math.PI / 2);
                addInstDougong(cx - w / 2, yBase + h, cz + dz, -Math.PI / 2);
            }

            if (plaqueText) {
                const pMat = new THREE.MeshStandardMaterial({ map: createPlaqueTex(plaqueText), roughness: 0.28, metalness: 0.35 });
                const plaque = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.45, 0.22), pMat);
                plaque.position.set(0, h - 0.55, d / 2 + 0.42);
                plaque.rotation.x = 0.08;
                hallGroup.add(plaque);
            }

            masterGroup.add(hallGroup);

            const eaveW = w + eaveExt * 2, eaveD = d + eaveExt * 2;
            if (upperW === 0) {
                buildQinHipRoof(cx, yBase + h + 0.35, cz, eaveW, eaveD, w * 0.46, 0.0, roofH, true, highPoly);
            } else {
                buildQinHipRoof(cx, yBase + h + 0.35, cz, eaveW, eaveD, upperW - 0.4, upperD - 0.4, roofH, false, highPoly);
            }
        }

        function buildPingzuoPlatform(cx, yBottom, cz, w, d, h = 0.7) {
            const pGroup = new THREE.Group();
            pGroup.position.set(cx, yBottom, cz);
            const base = new THREE.Mesh(new THREE.BoxGeometry(w + 1.4, h, d + 1.4), matEbonyWood);
            base.position.y = h / 2;
            const railFB = new THREE.Mesh(new THREE.BoxGeometry(w + 1.6, 0.65, 0.16), matQinBeam);
            for (let sz of [-(d + 1.4) / 2, (d + 1.4) / 2]) {
                const r = railFB.clone(); r.position.set(0, h + 0.32, sz);
                pGroup.add(r);
            }
            const railLR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.65, d + 1.6), matQinBeam);
            for (let sx of [-(w + 1.4) / 2, (w + 1.4) / 2]) {
                const r = railLR.clone(); r.position.set(sx, h + 0.32, 0);
                pGroup.add(r);
            }
            pGroup.add(base);
            masterGroup.add(pGroup);
        }

        function buildExternalGrandStaircase(cx, zTopEdge, zBottomEdge, yTop, yBottom, width, hasDragonRamp = true) {
            const sg = new THREE.Group();
            const run = Math.abs(zBottomEdge - zTopEdge);
            const drop = yTop - yBottom;
            const dir = Math.sign(zBottomEdge - zTopEdge);
            const steps = Math.max(8, Math.floor(drop * 2.0));
            const stepD = run / steps;

            for (let i = 0; i < steps; i++) {
                const h = ((steps - i) / steps) * drop;
                const zPos = zTopEdge + dir * (i + 0.5) * stepD;
                const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(width, h, stepD + 0.04), matDarkStone);
                stepMesh.position.set(cx, yBottom + h / 2, zPos);
                stepMesh.castShadow = true; stepMesh.receiveShadow = true;
                sg.add(stepMesh);
            }

            const rampLen = Math.hypot(drop, run);
            const rampAng = dir * Math.atan2(drop, run);
            const midZ = (zTopEdge + zBottomEdge) / 2;
            const midY = yBottom + drop / 2;

            if (hasDragonRamp) {
                const ramp = new THREE.Mesh(new THREE.BoxGeometry(width * 0.32, 0.25, rampLen), matQinBeam);
                ramp.position.set(cx, midY + 0.14, midZ);
                ramp.rotation.x = rampAng;
                sg.add(ramp);
            }

            for (let sx of [-width / 2 + 0.25, width / 2 - 0.25]) {
                const guard = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.75, rampLen), matDarkStone);
                guard.position.set(cx + sx, midY + 0.38, midZ);
                guard.rotation.x = rampAng;
                sg.add(guard);
            }
            masterGroup.add(sg);
        }

        function createPitchedGalleryRoofGeo(length, width, roofH) {
            const shape = new THREE.Shape();
            const hw = width / 2;
            shape.moveTo(-hw, 0);
            shape.quadraticCurveTo(-hw * 0.45, roofH * 0.38, 0, roofH);
            shape.quadraticCurveTo(hw * 0.45, roofH * 0.38, hw, 0);
            shape.lineTo(hw, -0.18);
            shape.lineTo(-hw, -0.18);
            shape.closePath();

            const geo = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, curveSegments: 6 });
            geo.translate(0, 0, -length / 2);
            geo.rotateY(Math.PI / 2);
            return geo;
        }

        // ==========================================
        // 8. 具有“起、承、转、合”完整营造逻辑的「秦式木构凌空复道」与「水陆爬山游廊」
        // ==========================================
        function buildBridgeheadPortalPavilion(cx, yDeck, cz, angle) {
            const pg = new THREE.Group();
            pg.position.set(cx, yDeck, cz);
            pg.rotation.y = -angle;

            const bracketBase1 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.7, 5.4), matEbonyWood);
            bracketBase1.position.y = -0.35;
            const bracketBase2 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.7, 4.6), matQinBeam);
            bracketBase2.position.y = -1.05;
            const stoneCorbel  = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 3.8), matDarkStone);
            stoneCorbel.position.y = -2.0;
            pg.add(bracketBase1, bracketBase2, stoneCorbel);

            const colH = 3.5;
            for (let sz of [-1.95, 1.95]) {
                const cheekWall = new THREE.Mesh(new THREE.BoxGeometry(3.6, colH, 0.85), matPalaceWall);
                cheekWall.position.set(0, colH / 2, sz);
                const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.35, 0.95), matGoldenColossus);
                goldTrim.position.set(0, colH - 0.2, sz);
                pg.add(cheekWall, goldTrim);
            }
            const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.75, 4.8), matQinBeam);
            lintel.position.set(0, colH - 0.38, 0);
            const glowCore = new THREE.Mesh(new THREE.BoxGeometry(2.6, colH * 0.65, 0.25), matWindowGlow);
            glowCore.position.set(0, colH * 0.45, 0);
            pg.add(lintel, glowCore);

            masterGroup.add(pg);

            for (let lx of [-1.7, 1.7]) {
                for (let lz of [-2.1, 2.1]) {
                    const wx = cx + lx * Math.cos(angle) + lz * Math.sin(angle);
                    const wz = cz - lx * Math.sin(angle) + lz * Math.cos(angle);
                    addInstPillar(wx, yDeck, wz, colH, 0.22);
                    addInstDougong(wx, yDeck + colH, wz, -angle, 0.9);
                }
            }
            buildQinHipRoof(cx, yDeck + colH + 0.25, cz, 7.6, 7.6, 2.2, 0.0, 2.1, true, false);
        }

        function buildSkyBridgeMonumentalPier(px, pz, yDeck, angle) {
            const pierGroup = new THREE.Group();
            pierGroup.position.set(px, 0, pz);
            pierGroup.rotation.y = -angle;

            const stoneH = Math.min(5.2, yDeck * 0.42);
            const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.6, 6.8), matWhiteJade);
            basePlinth.position.y = 0.3;
            pierGroup.add(basePlinth);

            for (let sz of [-2.1, 2.1]) {
                const leg = new THREE.Mesh(new THREE.BoxGeometry(3.8, stoneH - 1.2, 1.9), matDarkStone);
                leg.position.set(0, (stoneH - 1.2) / 2 + 0.3, sz);
                leg.castShadow = true; leg.receiveShadow = true;
                pierGroup.add(leg);
            }
            const archTop = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.3, 6.4), matRammedEarth);
            archTop.position.y = stoneH - 0.35;
            const goldCap = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.32, 6.7), matGoldenColossus);
            goldCap.position.y = stoneH + 0.32;
            pierGroup.add(archTop, goldCap);

            const timberH = yDeck - stoneH - 1.6;
            if (timberH > 0.5) {
                for (let lx of [-1.1, 1.1]) {
                    for (let lz of [-1.8, 1.8]) {
                        const wx = px + lx * Math.cos(angle) + lz * Math.sin(angle);
                        const wz = pz - lx * Math.sin(angle) + lz * Math.cos(angle);
                        addInstPillar(wx, stoneH + 0.4, wz, timberH, 0.32);
                    }
                }
                const tieBeam = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.38, 4.6), matCinnabarPillar);
                tieBeam.position.set(0, stoneH + 0.4 + timberH * 0.55, 0);
                pierGroup.add(tieBeam);
            }

            const t1 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.45, 5.2), matEbonyWood);
            t1.position.y = yDeck - 1.25;
            const t2 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.45, 5.8), matQinBeam);
            t2.position.y = yDeck - 0.80;
            const t3 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.40, 6.4), matCinnabarPillar);
            t3.position.y = yDeck - 0.38;
            pierGroup.add(t1, t2, t3);

            masterGroup.add(pierGroup);
        }

        function buildArchitecturalSkyBridge(x1, z1, x2, z2, yDeck1, yDeck2 = null, hasCenterPavilion = true) {
            if (yDeck2 === null) yDeck2 = yDeck1;
            const len = Math.hypot(x2 - x1, z2 - z1);
            const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2;
            const my = (yDeck1 + yDeck2) / 2;
            const angle = Math.atan2(z2 - z1, x2 - x1);
            const pitch = Math.atan2(yDeck2 - yDeck1, len);
            const slopeLen = Math.hypot(len, yDeck2 - yDeck1);

            buildBridgeheadPortalPavilion(x1, yDeck1, z1, angle);
            buildBridgeheadPortalPavilion(x2, yDeck2, z2, angle);

            const bridgeGroup = new THREE.Group();
            bridgeGroup.position.set(mx, my, mz);
            bridgeGroup.rotation.y = -angle;
            bridgeGroup.rotation.z = pitch;

            const deckW = 3.8, colH = 3.1;
            const underBeam = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.58, deckW), matEbonyWood);
            underBeam.position.y = -0.29;
            underBeam.castShadow = true;
            const trimF = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.45, 0.16), matQinBeam);
            trimF.position.set(0, -0.25, deckW / 2 + 0.05);
            const trimB = trimF.clone(); trimB.position.z = -deckW / 2 - 0.05;
            bridgeGroup.add(underBeam, trimF, trimB);

            for (let sz of [-deckW / 2 + 0.2, deckW / 2 - 0.2]) {
                const rail = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.72, 0.18), matCinnabarPillar);
                rail.position.set(0, 0.36, sz);
                const topBeam = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.38, 0.26), matQinBeam);
                topBeam.position.set(0, colH - 0.2, sz);
                bridgeGroup.add(rail, topBeam);
            }

            const coreWin = new THREE.Mesh(new THREE.BoxGeometry(slopeLen * 0.90, colH * 0.52, 0.22), matWindowGlow);
            coreWin.position.set(0, colH * 0.55, 0);
            bridgeGroup.add(coreWin);

            const roofGeo = createPitchedGalleryRoofGeo(slopeLen + 0.4, deckW + 1.8, 1.55);
            const roofMesh = new THREE.Mesh(roofGeo, matQinRibbedRoof);
            roofMesh.position.y = colH;
            roofMesh.castShadow = true; roofMesh.receiveShadow = true;
            const mainRidge = new THREE.Mesh(new THREE.BoxGeometry(slopeLen + 0.6, 0.26, 0.28), matGoldenColossus);
            mainRidge.position.y = colH + 1.55;
            bridgeGroup.add(roofMesh, mainRidge);

            masterGroup.add(bridgeGroup);

            const numBays = Math.max(3, Math.floor(len / 3.4));
            for (let i = 1; i < numBays; i++) {
                const t = i / numBays;
                const wx = THREE.MathUtils.lerp(x1, x2, t);
                const wz = THREE.MathUtils.lerp(z1, z2, t);
                const wy = THREE.MathUtils.lerp(yDeck1, yDeck2, t);
                for (let s of [-deckW / 2 + 0.25, deckW / 2 - 0.25]) {
                    const px = wx + Math.sin(angle) * s;
                    const pz = wz + Math.cos(angle) * s;
                    addInstPillar(px, wy, pz, colH, 0.17);
                    addInstDougong(px, wy + colH - 0.1, pz, -angle, 0.65);
                }
            }

            const pierCount = len > 24 ? 2 : 1;
            for (let p = 1; p <= pierCount; p++) {
                const pt = p / (pierCount + 1);
                const px = THREE.MathUtils.lerp(x1, x2, pt);
                const pz = THREE.MathUtils.lerp(z1, z2, pt);
                const py = THREE.MathUtils.lerp(yDeck1, yDeck2, pt);
                buildSkyBridgeMonumentalPier(px, pz, py, angle);
            }

            if (hasCenterPavilion && len >= 16) {
                buildPingzuoPlatform(mx, my - 0.35, mz, 5.8, 5.8, 0.6);
                const pavCurtain = new THREE.Mesh(new THREE.BoxGeometry(4.2, colH * 0.85, 4.2), matSilkCurtain);
                pavCurtain.position.set(mx, my + colH * 0.45, mz);
                masterGroup.add(pavCurtain);
                buildQinHipRoof(mx, my + colH + 0.4, mz, 8.2, 8.2, 4.2, 4.2, 1.2, false, false);
                buildQinHipRoof(mx, my + colH + 1.55, mz, 6.2, 6.2, 0.3, 0.0, 2.2, true, false);
            }
        }

        function buildShorelinePortalGatehouse(cx, cz, yFloor = 0.36, rotY = 0) {
            const gate = new THREE.Group();
            gate.position.set(cx, 0, cz);
            gate.rotation.y = rotY;

            const base = new THREE.Mesh(new THREE.BoxGeometry(4.8, yFloor + 0.15, 4.8), matDarkStone);
            base.position.y = (yFloor + 0.15) / 2;
            const jadeStep = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.18, 5.6), matWhiteJade);
            jadeStep.position.y = 0.09;
            gate.add(base, jadeStep);

            const colH = 3.1;
            for (let sz of [-1.75, 1.75]) {
                const wall = new THREE.Mesh(new THREE.BoxGeometry(3.2, colH, 0.55), matPalaceWall);
                wall.position.set(0, yFloor + colH / 2, sz);
                const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.28, 10), matWhiteJade);
                drum.position.set(-1.8, yFloor + 0.35, sz);
                gate.add(wall, drum);
            }
            const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.55, 4.2), matQinBeam);
            lintel.position.set(0, yFloor + colH - 0.25, 0);
            gate.add(lintel);
            masterGroup.add(gate);

            for (let lx of [-1.5, 1.5]) {
                for (let lz of [-1.8, 1.8]) {
                    const wx = cx + lx * Math.cos(rotY) - lz * Math.sin(rotY);
                    const wz = cz + lx * Math.sin(rotY) + lz * Math.cos(rotY);
                    addInstPillar(wx, yFloor, wz, colH, 0.20);
                    addInstDougong(wx, yFloor + colH, wz, rotY, 0.8);
                }
            }
            buildQinHipRoof(cx, yFloor + colH + 0.25, cz, 6.8, 6.8, 1.8, 0.0, 1.8, true, false);
        }

        function buildSteppedClimbingCloister(x1, z1, y1, x2, z2, y2, hasTopLandingHall = true) {
            const run = Math.hypot(x2 - x1, z2 - z1);
            const drop = y2 - y1;
            const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, my = (y1 + y2) / 2;
            const angle = Math.atan2(z2 - z1, x2 - x1);
            const pitch = Math.atan2(drop, run);
            const slopeLen = Math.hypot(run, drop);

            const cg = new THREE.Group();
            cg.position.set(mx, 0, mz);
            cg.rotation.y = -angle;

            const steps = Math.max(8, Math.floor(Math.abs(drop) * 2.2));
            const stepRun = run / steps;
            for (let i = 0; i < steps; i++) {
                const t = (i + 0.5) / steps;
                const sh = THREE.MathUtils.lerp(y1, y2, (i + 1) / steps);
                const sx = (t - 0.5) * run;
                const stepBox = new THREE.Mesh(new THREE.BoxGeometry(stepRun + 0.08, sh, 3.6), matDarkStone);
                stepBox.position.set(sx, sh / 2, 0);
                stepBox.castShadow = true; stepBox.receiveShadow = true;
                cg.add(stepBox);
            }

            const colH = 2.85;
            const slopedPart = new THREE.Group();
            slopedPart.position.set(0, my, 0);
            slopedPart.rotation.z = pitch;

            for (let sz of [-1.45, 1.45]) {
                const guardStone = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.35, 0.28), matWhiteJade);
                guardStone.position.set(0, 0.18, sz);
                const rail = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.62, 0.16), matCinnabarPillar);
                rail.position.set(0, 0.55, sz);
                const beam = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.35, 0.24), matQinBeam);
                beam.position.set(0, colH - 0.15, sz);
                slopedPart.add(guardStone, rail, beam);
            }

            const roofGeo = createPitchedGalleryRoofGeo(slopeLen + 0.6, 4.8, 1.35);
            const roofMesh = new THREE.Mesh(roofGeo, matQinRibbedRoof);
            roofMesh.position.y = colH;
            roofMesh.castShadow = true;
            const ridge = new THREE.Mesh(new THREE.BoxGeometry(slopeLen + 0.8, 0.24, 0.26), matGoldenColossus);
            ridge.position.y = colH + 1.35;
            slopedPart.add(roofMesh, ridge);

            cg.add(slopedPart);
            masterGroup.add(cg);

            const numCols = Math.max(3, Math.floor(run / 3.0));
            for (let i = 0; i <= numCols; i++) {
                const t = i / numCols;
                const wx = THREE.MathUtils.lerp(x1, x2, t);
                const wz = THREE.MathUtils.lerp(z1, z2, t);
                const wy = THREE.MathUtils.lerp(y1, y2, t);
                for (let s of [-1.45, 1.45]) {
                    const cpx = wx + Math.sin(angle) * s;
                    const cpz = wz + Math.cos(angle) * s;
                    addInstPillar(cpx, wy, cpz, colH, 0.18);
                }
            }

            if (hasTopLandingHall) {
                buildQinHipRoof(x2, y2 + colH + 0.35, z2, 6.4, 6.4, 1.6, 0.0, 1.75, true, false);
            }
        }

        function buildCoveredCloister(x1, z1, x2, z2, isOverWater = false, yFloor = 0.36) {
            const len = Math.hypot(x2 - x1, z2 - z1);
            const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2;
            const angle = Math.atan2(z2 - z1, x2 - x1);
            const colH = 2.75;

            const cg = new THREE.Group();
            cg.position.set(mx, 0, mz);
            cg.rotation.y = -angle;

            const base = new THREE.Mesh(new THREE.BoxGeometry(len, yFloor, 3.4), isOverWater ? matEbonyWood : matDarkStone);
            base.position.y = yFloor / 2;
            base.receiveShadow = true;

            const jadeTrim = new THREE.Mesh(new THREE.BoxGeometry(len + 0.1, 0.10, 3.55), matWhiteJade);
            jadeTrim.position.y = yFloor - 0.05;

            for (let sz of [-1.35, 1.35]) {
                const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.56, 0.14), matCinnabarPillar);
                rail.position.set(0, yFloor + 0.28, sz);
                const beam = new THREE.Mesh(new THREE.BoxGeometry(len, 0.30, 0.22), matQinBeam);
                beam.position.set(0, yFloor + colH - 0.15, sz);
                cg.add(rail, beam);
            }

            const roofGeo = createPitchedGalleryRoofGeo(len + 0.4, 4.6, 1.30);
            const roofMesh = new THREE.Mesh(roofGeo, matQinRibbedRoof);
            roofMesh.position.y = yFloor + colH;
            roofMesh.castShadow = true; roofMesh.receiveShadow = true;

            const ridge = new THREE.Mesh(new THREE.BoxGeometry(len + 0.5, 0.22, 0.24), matGoldenColossus);
            ridge.position.y = yFloor + colH + 1.30;

            cg.add(base, jadeTrim, roofMesh, ridge);
            masterGroup.add(cg);

            const steps = Math.max(2, Math.floor(len / 3.6));
            for (let i = 1; i < steps; i++) {
                const t = i / steps;
                const px = THREE.MathUtils.lerp(x1, x2, t);
                const pz = THREE.MathUtils.lerp(z1, z2, t);
                for (let s of [-1.35, 1.35]) {
                    const cpx = px + Math.sin(angle) * s;
                    const cpz = pz + Math.cos(angle) * s;
                    addInstPillar(cpx, yFloor, cpz, colH, 0.16);
                }
            }
        }

        function buildQinWaterPavilionShuixie(cx, cz, deckW, deckD, isTwoStory = true, plaqueText = null, hasDockSteps = true) {
            const sxGroup = new THREE.Group();
            const yFloor = 0.36;
            sxGroup.position.set(cx, 0, cz);

            const mainDeck = new THREE.Mesh(new THREE.BoxGeometry(deckW, yFloor, deckD), matEbonyWood);
            mainDeck.position.y = yFloor / 2;
            mainDeck.castShadow = true; mainDeck.receiveShadow = true;
            const jadeRim = new THREE.Mesh(new THREE.BoxGeometry(deckW + 0.3, 0.12, deckD + 0.3), matWhiteJade);
            jadeRim.position.y = yFloor - 0.04;
            sxGroup.add(mainDeck, jadeRim);

            for (let sz of [-deckD / 2 + 0.25, deckD / 2 - 0.25]) {
                for (let sideX of [-1, 1]) {
                    const segW = (deckW - 4.0) / 2;
                    const r = new THREE.Mesh(new THREE.BoxGeometry(segW, 0.62, 0.15), matCinnabarPillar);
                    r.position.set(sideX * (2.0 + segW / 2), yFloor + 0.31, sz);
                    r.rotation.x = sz > 0 ? 0.14 : -0.14;
                    sxGroup.add(r);
                }
            }
            for (let sx of [-deckW / 2 + 0.25, deckW / 2 - 0.25]) {
                const r = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.62, deckD - 0.6), matCinnabarPillar);
                r.position.set(sx, yFloor + 0.31, 0);
                r.rotation.z = sx > 0 ? -0.14 : 0.14;
                sxGroup.add(r);
            }

            for (let sz of [-deckD / 2 - 0.6, deckD / 2 + 0.6]) {
                const porchRoof = createPitchedGalleryRoofGeo(3.2, 4.8, 1.35);
                porchRoof.rotateY(Math.PI / 2);
                const pm = new THREE.Mesh(porchRoof, matQinRibbedRoof);
                pm.position.set(0, yFloor + 2.75, sz);
                sxGroup.add(pm);
            }

            if (hasDockSteps) {
                const step = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.22, 0.65), matWhiteJade);
                step.position.set(0, 0.12, deckD / 2 + 0.35);
                sxGroup.add(step);
            }

            const hallW = deckW - 4.4, hallD = deckD - 4.4, hallH = 4.2;
            const innerLanternCore = new THREE.Mesh(new THREE.BoxGeometry(hallW * 0.55, hallH * 0.82, hallD * 0.55), matWindowGlow);
            innerLanternCore.position.y = yFloor + hallH * 0.45;
            sxGroup.add(innerLanternCore);

            for (let ix = -1; ix <= 1; ix += 2) {
                for (let iz = -1; iz <= 1; iz += 2) {
                    const curtainF = new THREE.Mesh(new THREE.PlaneGeometry(hallW * 0.35, hallH * 0.76), matSilkCurtain);
                    curtainF.position.set(ix * hallW * 0.28, yFloor + hallH * 0.44, iz * (hallD / 2 - 0.08));
                    const curtainS = new THREE.Mesh(new THREE.PlaneGeometry(hallD * 0.35, hallH * 0.76), matSilkCurtain);
                    curtainS.rotation.y = Math.PI / 2;
                    curtainS.position.set(ix * (hallW / 2 - 0.08), yFloor + hallH * 0.44, iz * hallD * 0.28);
                    sxGroup.add(curtainF, curtainS);
                }
            }

            masterGroup.add(sxGroup);

            if (isTwoStory) {
                const upW = hallW * 0.68, upD = hallD * 0.68;
                buildModularQinHall(cx, yFloor, cz, hallW, hallD, hallH, 2.4, 1.5, upW, upD, plaqueText, true);
                buildPingzuoPlatform(cx, yFloor + hallH + 1.8, cz, upW, upD, 0.55);
                buildModularQinHall(cx, yFloor + hallH + 2.35, cz, upW - 0.4, upD - 0.4, 3.4, 2.2, 2.5, 0, 0, null, true);
            } else {
                buildModularQinHall(cx, yFloor, cz, hallW, hallD, hallH, 2.4, 2.5, 0, 0, plaqueText, true);
            }
        }

        function buildWaterCornerGazebo(cx, cz, yFloor = 0.36) {
            const colH = 2.75;
            const gz = new THREE.Group();
            gz.position.set(cx, 0, cz);
            const base = new THREE.Mesh(new THREE.BoxGeometry(5.4, yFloor, 5.4), matDarkStone);
            base.position.y = yFloor / 2;
            const jadeCap = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.12, 5.7), matWhiteJade);
            jadeCap.position.y = yFloor - 0.04;
            gz.add(base, jadeCap);

            for (let sx of [-2.1, 2.1]) {
                for (let sz of [-2.1, 2.1]) {
                    addInstPillar(cx + sx, yFloor, cz + sz, colH, 0.20);
                    addInstDougong(cx + sx, yFloor + colH, cz + sz, 0, 0.8);
                }
            }
            masterGroup.add(gz);
            buildQinHipRoof(cx, yFloor + colH + 0.3, cz, 7.8, 7.8, 3.0, 3.0, 1.1, false, false);
            buildQinHipRoof(cx, yFloor + colH + 1.35, cz, 5.4, 5.4, 0.2, 0.0, 1.9, true, false);
        }

        const animatedBarges = [];
        function createImperialDragonBarge(cx, cz, axis = 'z', patrolRadius = 7.0, speed = 0.28) {
            const barge = new THREE.Group();
            barge.position.set(cx, 0.12, cz);
            if (axis === 'x') barge.rotation.y = Math.PI / 2;

            const hullShape = new THREE.Shape();
            hullShape.moveTo(-5.8, 0.0);
            hullShape.lineTo( 5.8, 0.0);
            hullShape.lineTo( 7.4, 0.85);
            hullShape.lineTo(-7.4, 0.85);
            hullShape.closePath();
            const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 3.2, bevelEnabled: false });
            hullGeo.translate(0, 0, -1.6);
            hullGeo.rotateY(Math.PI / 2);
            const hullMesh = new THREE.Mesh(hullGeo, matEbonyWood);
            hullMesh.castShadow = true;

            const deckTrim = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.14, 14.2), matGoldenColossus);
            deckTrim.position.y = 0.85;

            const dragonNeck = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.1, 0.45), matGoldenColossus);
            dragonNeck.position.set(0, 1.35, 7.1);
            dragonNeck.rotation.x = 0.28;
            const dragonHead = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.45, 0.95), matGoldenColossus);
            dragonHead.position.set(0, 1.85, 7.45);
            const bowLantern = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), matFireGlow);
            bowLantern.position.set(0, 1.35, 7.85);

            const cabinCore = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 6.4), matWindowGlow);
            cabinCore.position.y = 1.82;
            const cabinFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.24, 6.8), matCinnabarPillar);
            cabinFrame.position.y = 2.65;

            for (let sx of [-1.15, 1.15]) {
                for (let sz of [-3.1, 0, 3.1]) {
                    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.85, 8), matCinnabarPillar);
                    post.position.set(sx, 1.82, sz);
                    barge.add(post);
                }
            }

            const boatRoofGeo = createPitchedGalleryRoofGeo(7.8, 3.6, 0.95);
            boatRoofGeo.rotateY(Math.PI / 2);
            const boatRoof = new THREE.Mesh(boatRoofGeo, matQinRibbedRoof);
            boatRoof.position.y = 2.75;
            boatRoof.castShadow = true;
            const boatRidge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 8.0), matGoldenColossus);
            boatRidge.position.y = 3.70;

            barge.add(hullMesh, deckTrim, dragonNeck, dragonHead, bowLantern, cabinCore, cabinFrame, boatRoof, boatRidge);
            masterGroup.add(barge);

            animatedBarges.push({
                mesh: barge,
                cx, cz, axis,
                r: patrolRadius, speed,
                phase: Math.random() * Math.PI * 2
            });
        }

        // ==========================================
        // 9. 区域一：阿房前殿大夯土巨台
        // ==========================================
        const animatedBanners = [];

        function buildZone1_EpangFrontHallCitadel() {
            const citadel = new THREE.Group();
            const tiers = [
                { w: 124.0, d: 72.0, cz: -20.0, yBot: 0.0,  h: 5.0 },
                { w: 108.0, d: 58.0, cz: -23.0, yBot: 5.0,  h: 5.0 },
                { w:  92.0, d: 44.0, cz: -26.0, yBot: 10.0, h: 5.0 }
            ];

            tiers.forEach(t => {
                const earth = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h - 0.4, t.d), matRammedEarth);
                earth.position.set(0, t.yBot + (t.h - 0.4) / 2, t.cz);
                earth.castShadow = true; earth.receiveShadow = true;
                const stoneCap = new THREE.Mesh(new THREE.BoxGeometry(t.w + 0.8, 0.42, t.d + 0.8), matDarkStone);
                stoneCap.position.set(0, t.yBot + t.h - 0.20, t.cz);
                stoneCap.castShadow = true; stoneCap.receiveShadow = true;
                citadel.add(earth, stoneCap);

                const zFront = t.cz + t.d / 2;
                const yTop = t.yBot + t.h;
                for (let x = -t.w / 2; x <= t.w / 2; x += 4.0) {
                    if (Math.abs(x) < 9.5 || (Math.abs(x) > 32 && Math.abs(x) < 42)) continue;
                    addInstStonePost(x, yTop, zFront);
                }
            });
            masterGroup.add(citadel);

            buildExternalGrandStaircase(0, 16.0, 28.0, 5.0, 0.0, 18.0, true);
            buildExternalGrandStaircase(-37.0, 16.0, 25.0, 5.0, 0.0, 7.0, false);
            buildExternalGrandStaircase( 37.0, 16.0, 25.0, 5.0, 0.0, 7.0, false);

            buildExternalGrandStaircase(0, 6.0, 16.0, 10.0, 5.0, 16.0, true);
            buildExternalGrandStaircase(-37.0, 6.0, 15.0, 10.0, 5.0, 6.5, false);
            buildExternalGrandStaircase( 37.0, 6.0, 15.0, 10.0, 5.0, 6.5, false);

            buildExternalGrandStaircase(0, -4.0, 6.0, 15.0, 10.0, 14.0, true);
            buildExternalGrandStaircase(0, -56.0, -64.0, 5.0, 0.0, 14.0, true);

            const czMain = -26.0;
            buildModularQinHall(0, 15.0, czMain, 56.0, 25.0, 6.8, 3.6, 2.0, 44.0, 18.5, '阿 房 前 殿', true);
            buildPingzuoPlatform(0, 24.3, czMain, 44.0, 18.5, 0.7);
            buildModularQinHall(0, 25.0, czMain, 42.0, 17.5, 5.2, 3.0, 1.8, 30.0, 11.8, null, true);
            buildPingzuoPlatform(0, 32.6, czMain, 30.0, 11.8, 0.7);
            buildModularQinHall(0, 33.3, czMain, 28.0, 11.0, 4.4, 2.8, 3.8, 0, 0, '天 極 朝 宮', true);

            for (let side of [-1, 1]) {
                buildModularQinHall(side * 37.0, 15.0, czMain, 14.0, 16.0, 5.0, 2.0, 2.6, 0, 0, side < 0 ? '西 極 殿' : '東 華 殿', true);
                buildModularQinHall(side * 50.0, 5.0, 6.0, 13.0, 13.0, 4.8, 2.0, 1.5, 9.0, 9.0, null, false);
                buildPingzuoPlatform(side * 50.0, 11.6, 6.0, 9.0, 9.0, 0.6);
                buildModularQinHall(side * 50.0, 12.2, 6.0, 8.4, 8.4, 3.8, 1.8, 2.6, 0, 0, side < 0 ? '驚 世 鼓 樓' : '震 宇 鐘 樓', false);
            }

            const poleGeo = new THREE.CylinderGeometry(0.09, 0.15, 10.5, 8);
            for (let side of [-1, 1]) {
                for (let f = 0; f < 6; f++) {
                    const fx = side * (13.0 + f * 6.2);
                    const fz = 30.5;
                    const pole = new THREE.Mesh(poleGeo, matGoldenColossus);
                    pole.position.set(fx, 5.25, fz);
                    pole.castShadow = true;
                    const spear = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.7, 6), matGoldenColossus);
                    spear.position.set(fx, 10.8, fz);
                    masterGroup.add(pole, spear);

                    const flagGeo = new THREE.PlaneGeometry(2.4, 4.6, 10, 6);
                    const flagMesh = new THREE.Mesh(flagGeo, matBanner);
                    flagMesh.position.set(fx + side * 1.25, 7.8, fz);
                    flagMesh.castShadow = true;
                    masterGroup.add(flagMesh);
                    animatedBanners.push({
                        mesh: flagMesh,
                        basePos: flagGeo.attributes.position.array.slice(),
                        phase: f * 0.8 + (side > 0 ? 0 : 2.0)
                    });
                }
            }
        }
        buildZone1_EpangFrontHallCitadel();

        // ==========================================
        // 10. 区域二：东西两翼「兰池水院与沧池水院」
        // ==========================================
        function buildZone2_ImperialWaterGardensAndShuixie() {
            const gardenGroup = new THREE.Group();

            for (let side of [-1, 1]) {
                const lakeX = side * 89.0, lakeZ = 23.0, lakeW = 74.0, lakeD = 178.0;
                const waterBody = new THREE.Mesh(new THREE.BoxGeometry(lakeW, 0.16, lakeD), matWater);
                waterBody.position.set(lakeX, 0.04, lakeZ);
                waterBody.receiveShadow = true;
                gardenGroup.add(waterBody);

                const bankIn = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.36, 140.0), matDarkStone);
                bankIn.position.set(side * 52.0, 0.18, 42.0);
                const bankOut = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.36, lakeD), matDarkStone);
                bankOut.position.set(side * 126.0, 0.18, lakeZ);
                gardenGroup.add(bankIn, bankOut);

                const tx = side * 106.0;
                const islandTowers = [
                    { z: -26.0, name: side < 0 ? '西 極 瑤 臺' : '東 華 瓊 閣' },
                    { z:  18.0, name: side < 0 ? '春 融 歌 臺' : '清 商 舞 殿' },
                    { z:  62.0, name: side < 0 ? '右 翼 翔 鳳' : '左 翼 應 龍' }
                ];
                islandTowers.forEach(item => {
                    const islandRim = new THREE.Mesh(new THREE.BoxGeometry(27.0, 0.8, 27.0), matWhiteJade);
                    islandRim.position.set(tx, 0.4, item.z);
                    const base = new THREE.Mesh(new THREE.BoxGeometry(24.0, 8.0, 24.0), matRammedEarth);
                    base.position.set(tx, 4.0, item.z);
                    base.castShadow = true; base.receiveShadow = true;
                    const cap = new THREE.Mesh(new THREE.BoxGeometry(24.8, 0.4, 24.8), matDarkStone);
                    cap.position.set(tx, 8.0, item.z);
                    gardenGroup.add(islandRim, base, cap);

                    buildModularQinHall(tx, 8.2, item.z, 17.0, 17.0, 5.0, 2.4, 1.8, 12.0, 12.0, item.name, false);
                    buildPingzuoPlatform(tx, 15.0, item.z, 12.0, 12.0, 0.6);
                    buildModularQinHall(tx, 15.6, item.z, 11.2, 11.2, 4.2, 2.2, 3.2, 0, 0, null, false);
                });

                buildArchitecturalSkyBridge(side * 46.0, -26.0, side * 98.5, -26.0, 15.0, 15.0, true);
                buildArchitecturalSkyBridge(tx, -18.5, tx,  10.5, 15.0, 15.0, true);
                buildArchitecturalSkyBridge(tx,  25.5, tx,  54.5, 15.0, 15.0, true);
                buildArchitecturalSkyBridge(side * 56.5, 6.0, side * 74.0, 6.0, 12.2, 13.5, false);
                buildArchitecturalSkyBridge(side * 74.0, 6.0, side * 74.0, -22.5, 13.5, 15.0, false);

                const shuixieList = [
                    { z: -4.0,  w: 20.0, d: 16.0, twoStory: true,  title: side < 0 ? '蘭 池 水 榭' : '滄 池 水 榭' },
                    { z:  40.0, w: 22.0, d: 18.0, twoStory: true,  title: side < 0 ? '凌 波 歌 榭' : '涵 碧 舞 榭' },
                    { z:  84.0, w: 18.0, d: 15.0, twoStory: false, title: side < 0 ? '濯 纓 水 亭' : '臨 流 水 閣' }
                ];
                shuixieList.forEach(sx => {
                    buildQinWaterPavilionShuixie(side * 74.0, sx.z, sx.w, sx.d, sx.twoStory, sx.title, true);
                });

                const waterGazeboZ = [-42.0, 18.0, 62.0, 102.0];
                waterGazeboZ.forEach(gz => {
                    buildWaterCornerGazebo(side * 74.0, gz, 0.36);
                });

                buildShorelinePortalGatehouse(side * 52.0,  18.0, 0.36, 0);
                buildShorelinePortalGatehouse(side * 52.0,  62.0, 0.36, 0);
                buildShorelinePortalGatehouse(side * 126.0, -42.0, 0.36, 0);

                buildCoveredCloister(side * 74.0, -39.2, side * 74.0, -12.0, true, 0.36);
                buildCoveredCloister(side * 74.0,   4.0, side * 74.0,  15.2, true, 0.36);
                buildCoveredCloister(side * 74.0,  20.8, side * 74.0,  31.0, true, 0.36);
                buildCoveredCloister(side * 74.0,  49.0, side * 74.0,  59.2, true, 0.36);
                buildCoveredCloister(side * 74.0,  64.8, side * 74.0,  76.5, true, 0.36);
                buildCoveredCloister(side * 74.0,  91.5, side * 74.0,  99.2, true, 0.36);

                buildCoveredCloister(side * 54.4,  18.0, side * 71.2,  18.0, true, 0.36);
                buildCoveredCloister(side * 54.4,  62.0, side * 71.2,  62.0, true, 0.36);
                buildCoveredCloister(side * 76.8, -42.0, side * 123.6, -42.0, true, 0.36);

                buildSteppedClimbingCloister(side * 76.8, 18.0, 0.36, side * 94.0, 18.0, 8.2, true);
                buildSteppedClimbingCloister(side * 76.8, 62.0, 0.36, side * 94.0, 62.0, 8.2, true);

                createImperialDragonBarge(side * 59.0, 40.0, 'z', 4.8, 0.32);
                createImperialDragonBarge(side * 98.0, 86.0, 'z', 4.5, 0.26);

                populateLotusAndKoiPatch(side * 63.0,   7.5, 13.0, 14.0, 42, 8);
                populateLotusAndKoiPatch(side * 86.0,   7.5, 13.0, 14.0, 40, 8);
                populateLotusAndKoiPatch(side * 63.0,  72.0, 13.0, 14.0, 42, 8);
                populateLotusAndKoiPatch(side * 86.0,  40.0, 12.0, 16.0, 40, 8);
                populateLotusAndKoiPatch(side * 63.0, -22.0, 12.0, 16.0, 36, 6);

                for (let w = 0; w < 8; w++) {
                    const wz = -50.0 + w * 20.0;
                    const wx = side * (w % 2 === 0 ? 53.5 : 124.5);
                    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 3.2, 7), matEbonyWood);
                    trunk.position.set(wx, 1.6, wz);
                    const crown = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 8), matWillowGreen);
                    crown.scale.set(1.1, 1.35, 1.1);
                    crown.position.set(wx - side * 0.6, 3.6, wz);
                    crown.castShadow = true;
                    gardenGroup.add(trunk, crown);
                }
            }

            const zRows = [-65.0, -26.0, 12.0, 50.0, 88.0];
            for (let side of [-1, 1]) {
                for (let colIdx = 0; colIdx < 2; colIdx++) {
                    const px = side * (144.0 + colIdx * 30.0);
                    const pBaseH = 2.4 + (colIdx === 1 ? 1.6 : 0);

                    zRows.forEach((pz, rIdx) => {
                        const pBase = new THREE.Mesh(new THREE.BoxGeometry(20.0, pBaseH, 16.0), matDarkStone);
                        pBase.position.set(px, pBaseH / 2, pz);
                        pBase.castShadow = true; pBase.receiveShadow = true;
                        const pCap = new THREE.Mesh(new THREE.BoxGeometry(20.6, 0.25, 16.6), matWhiteJade);
                        pCap.position.set(px, pBaseH, pz);
                        gardenGroup.add(pBase, pCap);

                        const isTall = (rIdx + colIdx) % 2 === 0;
                        if (isTall) {
                            buildModularQinHall(px, pBaseH, pz, 15.0, 11.5, 4.4, 2.0, 1.5, 10.0, 7.6, null, false);
                            buildPingzuoPlatform(px, pBaseH + 6.2, pz, 10.0, 7.6, 0.5);
                            buildModularQinHall(px, pBaseH + 6.7, pz, 9.4, 7.0, 3.6, 1.8, 2.6, 0, 0, null, false);
                        } else {
                            buildModularQinHall(px, pBaseH, pz, 15.5, 12.0, 4.8, 2.2, 2.8, 0, 0, null, false);
                        }

                        if (rIdx < zRows.length - 1) {
                            buildCoveredCloister(px, pz + 8.0, px, zRows[rIdx + 1] - 8.0, false, pBaseH);
                        }
                    });

                    buildExternalGrandStaircase(px, 96.0, 103.5, pBaseH, 0.0, 6.5, false);
                    buildExternalGrandStaircase(px, -73.0, -80.5, pBaseH, 0.0, 6.5, false);
                }

                zRows.forEach(pz => {
                    buildSteppedClimbingCloister(side * 154.0, pz, 2.4, side * 164.0, pz, 4.0, false);
                });
            }

            masterGroup.add(gardenGroup);
        }
        buildZone2_ImperialWaterGardensAndShuixie();

        // ==========================================
        // 11. 区域三：北苑太液池、水榭与百尺摘星楼
        // ==========================================
        function buildZone3_NorthImperialGardenAndStarTower() {
            const lakeW = 252.0, lakeD = 36.0, lakeZ = -82.0;
            const lakeWater = new THREE.Mesh(new THREE.BoxGeometry(lakeW, 0.16, lakeD), matWater);
            lakeWater.position.set(0, 0.04, lakeZ);
            lakeWater.receiveShadow = true;
            masterGroup.add(lakeWater);

            for (let sz of [-100.0, -64.0]) {
                const bank = new THREE.Mesh(new THREE.BoxGeometry(lakeW + 2.0, 0.36, 1.0), matDarkStone);
                bank.position.set(0, 0.18, sz);
                masterGroup.add(bank);
            }

            const bSegs = 20;
            for (let i = 0; i <= bSegs; i++) {
                const u = (i / bSegs) * 2 - 1;
                const bz = lakeZ + u * 17.5;
                const by = Math.pow(Math.cos(u * Math.PI * 0.5), 1.3) * 2.8 + 0.25;
                const deck = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.38, 1.85), matWhiteJade);
                deck.position.set(0, by, bz);
                deck.rotation.x = -Math.sin(u * Math.PI) * 0.18;
                masterGroup.add(deck);
            }

            buildQinWaterPavilionShuixie(-46.0, lakeZ, 20.0, 16.0, true, '蓬 萊 水 榭', true);
            buildQinWaterPavilionShuixie( 46.0, lakeZ, 20.0, 16.0, true, '瀛 洲 水 榭', true);
            buildShorelinePortalGatehouse(-46.0, -100.0, 0.36, Math.PI / 2);
            buildShorelinePortalGatehouse( 46.0, -100.0, 0.36, Math.PI / 2);
            buildCoveredCloister(-46.0, -97.8, -46.0, -90.2, true, 0.36);
            buildCoveredCloister( 46.0, -97.8,  46.0, -90.2, true, 0.36);

            createImperialDragonBarge(-23.0, lakeZ, 'x', 4.5, 0.25);
            createImperialDragonBarge( 23.0, lakeZ, 'x', 4.5, 0.25);

            populateLotusAndKoiPatch(-75.0, lakeZ, 26.0, 22.0, 45, 10);
            populateLotusAndKoiPatch( 75.0, lakeZ, 26.0, 22.0, 45, 10);

            const stZ = -128.0;
            const stBase1 = new THREE.Mesh(new THREE.BoxGeometry(44.0, 6.0, 36.0), matRammedEarth);
            stBase1.position.set(0, 3.0, stZ); stBase1.castShadow = true;
            const stBase2 = new THREE.Mesh(new THREE.BoxGeometry(34.0, 5.0, 28.0), matDarkStone);
            stBase2.position.set(0, 8.5, stZ); stBase2.castShadow = true;
            masterGroup.add(stBase1, stBase2);
            buildExternalGrandStaircase(0, -110.0, -100.0, 6.0, 0.0, 12.0, true);

            buildModularQinHall(0, 11.0, stZ, 26.0, 22.0, 5.6, 2.8, 1.8, 20.0, 17.0, '紫 微 摘 星 樓', true);
            buildPingzuoPlatform(0, 18.7, stZ, 20.0, 17.0, 0.6);
            buildModularQinHall(0, 19.3, stZ, 19.2, 16.2, 4.8, 2.4, 1.6, 14.5, 12.2, null, true);
            buildPingzuoPlatform(0, 26.0, stZ, 14.5, 12.2, 0.6);
            buildModularQinHall(0, 26.6, stZ, 14.0, 11.6, 4.4, 2.2, 1.5, 10.0, 8.2, null, true);
            buildPingzuoPlatform(0, 32.8, stZ, 10.0, 8.2, 0.6);
            buildModularQinHall(0, 33.4, stZ, 9.4, 7.6, 4.2, 2.0, 3.8, 0, 0, '通 天 臺', true);

            const haremCoords = [
                [-48, -128, '甘 泉 宮'], [48, -128, '蘭 池 宮'],
                [-88, -124, '長 楊 宮'], [88, -124, '五 柞 宮'],
                [-36, -155, '望 仙 閣'], [36, -155, '步 壽 閣'],
                [-76, -152, '雲 陽 殿'], [76, -152, '林 光 殿']
            ];
            haremCoords.forEach(([hx, hz, hName]) => {
                const hb = new THREE.Mesh(new THREE.BoxGeometry(20.0, 3.2, 16.0), matDarkStone);
                hb.position.set(hx, 1.6, hz); hb.castShadow = true;
                masterGroup.add(hb);
                buildModularQinHall(hx, 3.2, hz, 15.5, 11.5, 4.6, 2.2, 2.6, 0, 0, hName, false);
            });

            buildArchitecturalSkyBridge(-17.0, stZ, -38.0, stZ, 11.0, 3.2, false);
            buildArchitecturalSkyBridge( 17.0, stZ,  38.0, stZ, 11.0, 3.2, false);
        }
        buildZone3_NorthImperialGardenAndStarTower();

        // ==========================================
        // 12. 区域四：千步御道广场、【修正朝向后的高精度十二金人】与朝堂
        // ==========================================
        const fireBraziers = [];

        function buildZone4_TwelveGoldenColossiAndAvenue() {
            const aveGroup = new THREE.Group();

            const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 390), matPlaza);
            ground.rotation.x = -Math.PI / 2;
            ground.position.set(0, 0.01, 10.0);
            ground.receiveShadow = true;
            aveGroup.add(ground);

            const roadNorth = new THREE.Mesh(new THREE.BoxGeometry(18.0, 0.14, 83.5), matDarkStone);
            roadNorth.position.set(0, 0.07, (28.0 + 111.5) / 2);
            roadNorth.receiveShadow = true;
            aveGroup.add(roadNorth);

            const roadSouth = new THREE.Mesh(new THREE.BoxGeometry(18.0, 0.14, 70.5), matDarkStone);
            roadSouth.position.set(0, 0.07, (134.5 + 205.0) / 2);
            roadSouth.receiveShadow = true;
            aveGroup.add(roadSouth);

            // 【朝向修正】：金人局部正面为 +X 轴；
            // 西列 (sideSign = -1, x = -16.5) 旋转 +0.32 * PI (面朝东北：既面向中央御道，又朝拱北侧阿房前殿！)
            // 东列 (sideSign = +1, x = +16.5) 旋转 +0.68 * PI (面朝西北：同样既面向中央御道，又朝拱北侧阿房前殿！)
            function createDetailedGoldenColossus(x, z, sideSign) {
                const colossus = new THREE.Group();
                colossus.position.set(x, 0, z);
                colossus.rotation.y = sideSign < 0 ? Math.PI * 0.32 : Math.PI * 0.68;

                // 1) 须弥座基坛 (高 2.15m)
                const ped1 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.65, 4.2), matDarkStone);
                ped1.position.y = 0.325;
                const ped2 = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.95, 3.3), matWhiteJade);
                ped2.position.y = 1.125;
                const bronzeBand = new THREE.Mesh(new THREE.BoxGeometry(3.45, 0.32, 3.45), matAncientBronze);
                bronzeBand.position.y = 1.125;
                const ped3 = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.55, 3.8), matDarkStone);
                ped3.position.y = 1.875;
                colossus.add(ped1, ped2, bronzeBand, ped3);

                // 2) 双足重履与下裳宽摆褶裙
                for (let sz of [-0.42, 0.42]) {
                    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.32, 0.48), matAncientBronze);
                    boot.position.set(0.35, 2.30, sz);
                    colossus.add(boot);
                }
                const robeSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 1.32, 2.15, 16), matGoldenColossus);
                robeSkirt.position.y = 3.22;
                robeSkirt.scale.set(0.85, 1, 1.12);
                robeSkirt.castShadow = true;

                const frontApron = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.1, 0.85), matGoldenColossus);
                frontApron.position.set(0.82, 3.28, 0);
                frontApron.rotation.z = 0.14;
                colossus.add(robeSkirt, frontApron);

                // 3) 束腰玉带与青铜兽面带钩
                const waistBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.32, 16), matAncientBronze);
                waistBelt.position.y = 4.32;
                waistBelt.scale.set(0.85, 1, 1.15);
                const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.38, 0.46), matGoldenColossus);
                beltBuckle.position.set(0.80, 4.32, 0);
                colossus.add(waistBelt, beltBuckle);

                // 4) 雄阔玄甲胸铠与背甲
                const torso = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 0.88, 1.75, 16), matGoldenColossus);
                torso.position.y = 5.25;
                torso.scale.set(0.86, 1, 1.30);
                torso.castShadow = true;
                const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.25, 1.45), matGoldenColossus);
                chestPlate.position.set(0.82, 5.32, 0);
                colossus.add(torso, chestPlate);

                // 5) 双肩外翻龙纹肩吞
                for (let sz of [-1.22, 1.22]) {
                    const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.58, 12, 10), matGoldenColossus);
                    pauldron.scale.set(0.95, 0.65, 1.15);
                    pauldron.position.set(0.0, 5.88, sz);
                    const pauldronRim = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 0.75), matAncientBronze);
                    pauldronRim.position.set(0.0, 5.65, sz * 1.12);
                    pauldronRim.rotation.x = sz > 0 ? 0.35 : -0.35;
                    colossus.add(pauldron, pauldronRim);
                }

                // 6) 宽袖拱手礼姿 + 奉持镇国玉圭
                for (let sz of [-0.72, 0.72]) {
                    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 1.15, 10), matGoldenColossus);
                    upperArm.position.set(0.38, 5.25, sz * 1.35);
                    upperArm.rotation.x = sz > 0 ? 0.52 : -0.52;
                    upperArm.rotation.z = -0.35;
                    colossus.add(upperArm);
                }
                const claspedHands = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.55, 1.05), matGoldenColossus);
                claspedHands.position.set(0.98, 4.95, 0);
                const jadeTablet = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.45, 0.32), matWhiteJade);
                jadeTablet.position.set(1.12, 5.45, 0);
                jadeTablet.rotation.z = 0.18;
                colossus.add(claspedHands, jadeTablet);

                // 7) 颈部护领、面庞、眉骨鼻梁、长髯与秦代鹖冠
                const neckCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.38, 12), matAncientBronze);
                neckCollar.position.y = 6.22;
                const head = new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.05, 0.88), matGoldenColossus);
                head.position.y = 6.82;
                head.castShadow = true;
                const brow = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.68), matGoldenColossus);
                brow.position.set(0.44, 7.02, 0);
                const nose = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, 0.18), matGoldenColossus);
                nose.position.set(0.48, 6.82, 0);
                const beard = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.85, 5), matAncientBronze);
                beard.rotation.x = Math.PI;
                beard.position.set(0.46, 6.18, 0);

                const crownBase = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.24, 0.96), matAncientBronze);
                crownBase.position.y = 7.42;
                const crownTop = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.62, 0.68), matGoldenColossus);
                crownTop.position.y = 7.82;
                const hairpin = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.35, 8), matGoldenColossus);
                hairpin.rotation.x = Math.PI / 2;
                hairpin.position.y = 7.75;

                colossus.add(neckCollar, head, brow, nose, beard, crownBase, crownTop, hairpin);
                aveGroup.add(colossus);
            }

            for (let row = 0; row < 6; row++) {
                const zPos = 40.0 + row * 11.0;
                createDetailedGoldenColossus(-16.5, zPos, -1);
                createDetailedGoldenColossus( 16.5, zPos,  1);

                for (let sx of [-10.8, 10.8]) {
                    const ding = new THREE.Group();
                    ding.position.set(sx, 0, zPos);
                    const dBase = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 1.8), matDarkStone);
                    dBase.position.y = 0.175;
                    const dBody = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.0, 1.45), matAncientBronze);
                    dBody.position.y = 1.25; dBody.castShadow = true;
                    for (let lx of [-0.55, 0.55]) {
                        for (let lz of [-0.55, 0.55]) {
                            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.8, 8), matAncientBronze);
                            leg.position.set(lx, 0.6, lz);
                            ding.add(leg);
                        }
                    }
                    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.58, 1.25, 8), matFireGlow);
                    flame.position.y = 2.15;
                    ding.add(dBase, dBody, flame);
                    aveGroup.add(ding);
                    fireBraziers.push(flame);
                }
            }

            const minL = ['太 尉 府', '宗 正 寺', '廷 尉 署'];
            const minR = ['丞 相 府', '少 府 監', '典 客 署'];
            [42.0, 68.0, 94.0].forEach((mz, idx) => {
                for (let side of [-1, 1]) {
                    const mx = side * 36.0;
                    const mBase = new THREE.Mesh(new THREE.BoxGeometry(18.0, 2.0, 14.0), matDarkStone);
                    mBase.position.set(mx, 1.0, mz);
                    mBase.castShadow = true; mBase.receiveShadow = true;
                    aveGroup.add(mBase);
                    buildModularQinHall(mx, 2.0, mz, 14.5, 10.5, 4.4, 2.0, 2.5, 0, 0, side < 0 ? minL[idx] : minR[idx], false);
                    if (idx < 2) {
                        buildCoveredCloister(mx, mz + 7.0, mx, mz + 19.0, false, 2.0);
                    }
                }
            });

            masterGroup.add(aveGroup);
        }
        buildZone4_TwelveGoldenColossiAndAvenue();

        // ==========================================
        // 13. 区域五：二川溶溶、长桥卧波与三门道错金磁石门
        // ==========================================
        function buildZone5_RiversDragonBridgesAndMagnetiteGate() {
            const southGroup = new THREE.Group();

            const riverW = 420.0, riverD = 22.0, riverZ = 123.0;
            const waterMesh = new THREE.Mesh(new THREE.BoxGeometry(riverW, 0.16, riverD), matWater);
            waterMesh.position.set(0, 0.04, riverZ);
            waterMesh.receiveShadow = true;
            southGroup.add(waterMesh);

            for (let sz of [112.0, 134.0]) {
                const bank = new THREE.Mesh(new THREE.BoxGeometry(riverW, 0.45, 1.0), matDarkStone);
                bank.position.set(0, 0.225, sz);
                southGroup.add(bank);
            }

            const bridgeSegs = 28, halfBridgeLen = 12.5;
            for (let i = 0; i <= bridgeSegs; i++) {
                const u = (i / bridgeSegs) * 2 - 1;
                const zPos = riverZ + u * halfBridgeLen;
                const isCenterFlat = Math.abs(u) < 0.28;
                const archY = isCenterFlat ? 4.2 : Math.pow(Math.cos(u * Math.PI * 0.5), 1.25) * 4.2 + 0.25;
                const slopeAng = isCenterFlat ? 0 : -Math.sin(u * Math.PI) * 0.26;

                const deck = new THREE.Mesh(new THREE.BoxGeometry(13.0, 0.5, 1.05), matDarkStone);
                deck.position.set(0, archY, zPos);
                deck.rotation.x = slopeAng;
                deck.castShadow = true; deck.receiveShadow = true;
                southGroup.add(deck);

                if (i % 2 === 0 && !isCenterFlat) {
                    addInstStonePost(-6.0, archY + 0.25, zPos, 0.8);
                    addInstStonePost( 6.0, archY + 0.25, zPos, 0.8);
                }
            }
            buildModularQinHall(0, 4.45, riverZ, 11.6, 8.2, 4.2, 2.2, 1.5, 8.0, 5.6, '臥 波 龍 閣', true);
            buildPingzuoPlatform(0, 10.4, riverZ, 8.0, 5.6, 0.5);
            buildModularQinHall(0, 10.9, riverZ, 7.4, 5.2, 3.4, 1.8, 2.6, 0, 0, null, true);

            for (let sx of [-74.0, 74.0]) {
                for (let i = 0; i <= 20; i++) {
                    const u = (i / 20) * 2 - 1;
                    const zPos = riverZ + u * 12.0;
                    const archY = Math.pow(Math.cos(u * Math.PI * 0.5), 1.3) * 3.0 + 0.25;
                    const deck = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.4, 1.3), matDarkStone);
                    deck.position.set(sx, archY, zPos);
                    deck.rotation.x = -Math.sin(u * Math.PI) * 0.22;
                    southGroup.add(deck);
                }
                buildModularQinHall(sx, 3.45, riverZ, 7.6, 6.2, 3.6, 1.6, 2.2, 0, 0, null, false);
            }

            const gateZ = 162.0;
            const pierSpecs = [
                { x: -16.8, w: 6.4 },
                { x:  -6.2, w: 4.4 },
                { x:   6.2, w: 4.4 },
                { x:  16.8, w: 6.4 }
            ];
            pierSpecs.forEach(p => {
                const pier = new THREE.Mesh(new THREE.BoxGeometry(p.w, 8.2, 13.0), matMagnetite);
                pier.position.set(p.x, 4.1, gateZ);
                pier.castShadow = true; pier.receiveShadow = true;
                southGroup.add(pier);

                const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(p.w + 0.5, 0.75, 13.5), matWhiteJade);
                basePlinth.position.set(p.x, 0.375, gateZ);
                const goldWaist = new THREE.Mesh(new THREE.BoxGeometry(p.w + 0.3, 0.45, 13.3), matGoldenColossus);
                goldWaist.position.set(p.x, 4.2, gateZ);
                const goldCap = new THREE.Mesh(new THREE.BoxGeometry(p.w + 0.4, 0.35, 13.4), matGoldenColossus);
                goldCap.position.set(p.x, 8.0, gateZ);
                southGroup.add(basePlinth, goldWaist, goldCap);

                for (let sideS of [-1, 1]) {
                    const vein = new THREE.Mesh(new THREE.BoxGeometry(0.18, 6.4, 1.2), matMagneticVein);
                    vein.position.set(p.x + sideS * (p.w / 2 + 0.04), 4.0, gateZ);
                    southGroup.add(vein);
                }

                const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.14, 10, 18), matGoldenColossus);
                ring.position.set(p.x, 5.2, gateZ + 6.6);
                southGroup.add(ring);
            });

            const gateLintel = new THREE.Mesh(new THREE.BoxGeometry(41.0, 1.8, 13.4), matMagnetite);
            gateLintel.position.set(0, 8.3, gateZ);
            gateLintel.castShadow = true;
            const lintelGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(41.4, 0.35, 13.6), matGoldenColossus);
            lintelGoldTrim.position.set(0, 9.1, gateZ);
            southGroup.add(gateLintel, lintelGoldTrim);

            [-16.8, -6.2, 6.2, 16.8].forEach(bx => {
                const brazier = new THREE.Group();
                brazier.position.set(bx, 0, gateZ + 10.2);
                const bPed = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 1.8, 8), matDarkStone);
                bPed.position.y = 0.9;
                const bBowl = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.6, 0.9, 12), matGoldenColossus);
                bBowl.position.y = 2.2;
                const bFlame = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.6, 8), matFireGlow);
                bFlame.position.y = 3.2;
                brazier.add(bPed, bBowl, bFlame);
                southGroup.add(brazier);
                fireBraziers.push(bFlame);
            });

            buildModularQinHall(0, 9.25, gateZ, 30.0, 9.8, 4.8, 2.6, 1.6, 20.0, 6.8, '磁 石 門', true);
            buildPingzuoPlatform(0, 15.9, gateZ, 20.0, 6.8, 0.6);
            buildModularQinHall(0, 16.5, gateZ, 19.2, 6.2, 3.8, 2.2, 3.2, 0, 0, '卻 胡 雄 關', true);

            for (let side of [-1, 1]) {
                const qx = side * 42.0;
                const mainQue = new THREE.Mesh(new THREE.BoxGeometry(11.0, 14.0, 11.0), matRammedEarth);
                mainQue.position.set(qx, 7.0, gateZ); mainQue.castShadow = true;
                southGroup.add(mainQue);
                buildModularQinHall(qx, 14.0, gateZ, 9.2, 9.2, 4.2, 2.2, 3.0, 0, 0, side < 0 ? '西 極 闕' : '東 華 闕', true);

                for (let sub of [-1, 1]) {
                    const subX = qx + sub * 8.6;
                    const subQue = new THREE.Mesh(new THREE.BoxGeometry(6.0, 9.5, 7.2), matDarkStone);
                    subQue.position.set(subX, 4.75, gateZ); subQue.castShadow = true;
                    southGroup.add(subQue);
                    buildModularQinHall(subX, 9.5, gateZ, 5.2, 6.0, 3.2, 1.4, 2.0, 0, 0, null, false);
                }
            }

            const wallH = 6.5;
            for (let side of [-1, 1]) {
                const southWall = new THREE.Mesh(new THREE.BoxGeometry(140.0, wallH, 3.2), matPalaceWall);
                southWall.position.set(side * 126.0, wallH / 2, gateZ);
                southWall.castShadow = true;
                const sideWall = new THREE.Mesh(new THREE.BoxGeometry(3.2, wallH, 334.0), matPalaceWall);
                sideWall.position.set(side * 196.0, wallH / 2, -5.0);
                sideWall.castShadow = true;
                const northWall = new THREE.Mesh(new THREE.BoxGeometry(196.0, wallH, 3.2), matPalaceWall);
                northWall.position.set(side * 98.0, wallH / 2, -172.0);
                southGroup.add(southWall, sideWall, northWall);

                for (let wz of [-172.0, -65.0, 45.0, 162.0]) {
                    const bastion = new THREE.Mesh(new THREE.BoxGeometry(12.0, 8.5, 12.0), matDarkStone);
                    bastion.position.set(side * 196.0, 4.25, wz);
                    southGroup.add(bastion);
                    buildModularQinHall(side * 196.0, 8.5, wz, 9.5, 9.5, 4.0, 2.0, 2.8, 0, 0, null, false);
                }
            }

            masterGroup.add(southGroup);
        }
        buildZone5_RiversDragonBridgesAndMagnetiteGate();

        // ==========================================
        // 14. 一体式 360° 关中山水连续地形 + 零穿模城外苍松林
        // ==========================================
        function evalTerrainHeight(x, z) {
            const dx = Math.max(0, Math.abs(x) - 198.0);
            const dz = z < -174.0 ? (-174.0 - z) : (z > 200.0 ? (z - 200.0) : 0);
            const distFromCity = Math.hypot(dx, dz);

            if (distFromCity <= 0) return -0.15;

            const foothillBlend = THREE.MathUtils.smoothstep(distFromCity, 0, 95.0);
            const mountainBlend = THREE.MathUtils.smoothstep(distFromCity, 55.0, 320.0);
            const gentleRoll = (Math.sin(x * 0.018) * Math.cos(z * 0.018) + 1.2) * 4.5 * foothillBlend;

            const noise = Math.abs(
                Math.sin(x * 0.009 + z * 0.005) * 42 +
                Math.cos(x * 0.021 - z * 0.014) * 26 +
                Math.sin(x * 0.045 + z * 0.032) * 12
            );

            let regionalH = 0;
            if (z > 180) {
                const twinL = Math.exp(-Math.pow((x + 68) / 45, 2) - Math.pow((z - 460) / 140, 2)) * 135;
                const twinR = Math.exp(-Math.pow((x - 68) / 45, 2) - Math.pow((z - 460) / 140, 2)) * 135;
                const passDip = 1.0 - 0.58 * Math.exp(-Math.pow(x / 28, 2));
                regionalH = (noise * 1.35 * passDip) + twinL + twinR;
            } else if (x > 180) {
                const lishanPeak = Math.exp(-Math.pow((x - 440) / 160, 2) - Math.pow((z - 60) / 180, 2)) * 115;
                regionalH = noise * 1.1 + lishanPeak;
            } else if (z < -160) {
                regionalH = Math.min(58.0, noise * 0.75 + 22.0);
            } else {
                regionalH = noise * 0.85;
            }

            return gentleRoll + regionalH * mountainBlend;
        }

        function buildSeamlessGuanzhongTerrain() {
            const geoGroup = new THREE.Group();

            const size = 2200, segs = 140;
            const geo = new THREE.BufferGeometry();
            const positions = [], colors = [], indices = [];

            const cLoess   = new THREE.Color(0x3a3026);
            const cFoothill= new THREE.Color(0x1d3124);
            const cMidRock = new THREE.Color(0x223042);
            const cPeak    = new THREE.Color(0x5c7088);
            const tmpC     = new THREE.Color();

            for (let iz = 0; iz <= segs; iz++) {
                const z = (iz / segs - 0.5) * size;
                for (let ix = 0; ix <= segs; ix++) {
                    const x = (ix / segs - 0.5) * size;
                    const y = evalTerrainHeight(x, z);
                    positions.push(x, y, z);

                    if (y < 4.0) {
                        tmpC.copy(cLoess);
                    } else if (y < 24.0) {
                        tmpC.lerpColors(cLoess, cFoothill, (y - 4.0) / 20.0);
                    } else if (y < 75.0) {
                        tmpC.lerpColors(cFoothill, cMidRock, (y - 24.0) / 51.0);
                    } else {
                        tmpC.lerpColors(cMidRock, cPeak, Math.min(1.0, (y - 75.0) / 70.0));
                    }
                    colors.push(tmpC.r, tmpC.g, tmpC.b);
                }
            }

            for (let iz = 0; iz < segs; iz++) {
                for (let ix = 0; ix < segs; ix++) {
                    const a = iz * (segs + 1) + ix, b = a + 1;
                    const c = a + (segs + 1), d = c + 1;
                    indices.push(a, c, b, b, c, d);
                }
            }

            geo.setIndex(indices);
            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            geo.computeVertexNormals();

            const terrainMat = new THREE.MeshStandardMaterial({
                vertexColors: true, roughness: 0.92, metalness: 0.04, flatShading: true
            });
            const terrainMesh = new THREE.Mesh(geo, terrainMat);
            terrainMesh.receiveShadow = true;
            geoGroup.add(terrainMesh);

            const treeCount = 380;
            const pineConeGeo = new THREE.ConeGeometry(2.6, 7.5, 7);
            const pineInst = new THREE.InstancedMesh(pineConeGeo, matWillowGreen, treeCount);
            let tIdx = 0;
            for (let i = 0; i < treeCount * 2 && tIdx < treeCount; i++) {
                const tx = Math.sin(i * 12.9898) * 350.0;
                const tz = Math.cos(i * 78.233) * 330.0;

                if (Math.abs(tx) < 214.0 && tz > -190.0 && tz < 180.0) continue;
                if (Math.abs(tx) < 35.0 && tz >= 155.0) continue;

                const groundY = evalTerrainHeight(tx, tz);
                if (groundY < 0.2 || groundY > 48.0) continue;

                const s = 0.8 + (i % 5) * 0.22;
                dummy.position.set(tx, groundY + 3.4 * s, tz);
                dummy.rotation.set(0, i, 0);
                dummy.scale.set(s, s, s);
                dummy.updateMatrix();
                pineInst.setMatrixAt(tIdx++, dummy.matrix);
            }
            pineInst.count = tIdx;
            geoGroup.add(pineInst);

            masterGroup.add(geoGroup);
        }
        buildSeamlessGuanzhongTerrain();

        // 提交所有全局 InstancedMesh 数量
        instBlackTiles.count = blackTileCount;
        instGoldTiles.count = goldTileCount;
        instPillars.count = pillarCount;
        instPlinths.count = pillarCount;
        instDougong.count = dgCount;
        instDougongGold.count = dgCount;
        instStonePosts.count = postCount;
        instLotusLeaves.count = lotusLeafCount;
        instLotusFlowers.count = lotusFlowerCount;
        instKoiRed.count = koiRedCount;
        instKoiGold.count = koiGoldCount;

        masterGroup.add(
            instBlackTiles, instGoldTiles,
            instPillars, instPlinths,
            instDougong, instDougongGold,
            instStonePosts,
            instLotusLeaves, instLotusFlowers,
            instKoiRed, instKoiGold
        );

        // Batch only immutable, opaque geometry in small spatial cells. Materials,
        // normals, UVs, shadows and every source triangle are retained. Animated
        // boats, flags, fire and the existing instanced pools remain independent.
        function countSceneGeometry() {
            let meshes = 0, triangles = 0, instances = 0;
            masterGroup.traverse(object => {
                if (!object.isMesh) return;
                meshes++;
                const count = object.isInstancedMesh ? object.count : 1;
                if (object.isInstancedMesh) instances += count;
                triangles += ((object.geometry.index?.count || object.geometry.attributes.position.count) / 3) * count;
            });
            return { meshes, triangles, instances };
        }
        const geometryBefore = countSceneGeometry();
        const batchStarted = performance.now();
        const animatedRoots = new Set([
            ...animatedBarges.map(item => item.mesh), ...animatedBanners.map(item => item.mesh),
            ...fireBraziers, instKoiRed, instKoiGold
        ]);
        const dynamicObjects = new Set();
        for (const object of animatedRoots) object.traverse(child => dynamicObjects.add(child));
        masterGroup.updateMatrixWorld(true);
        const batches = new Map();
        const worldCenter = new THREE.Vector3();
        masterGroup.traverse(object => {
            if (!object.isMesh || object.isInstancedMesh || dynamicObjects.has(object) ||
                Array.isArray(object.material) || object.material.transparent || object.children.length ||
                object.geometry.attributes.position.count > 20000 || object.matrixWorld.determinant() <= 0) return;
            object.getWorldPosition(worldCenter);
            const attributes = Object.keys(object.geometry.attributes).sort().map(name => {
                const attribute = object.geometry.attributes[name];
                return `${name}:${attribute.itemSize}:${attribute.normalized}:${attribute.array.constructor.name}`;
            }).join(',');
            const key = [object.material.id, object.castShadow, object.receiveShadow, object.renderOrder,
                Math.floor(worldCenter.x / 32), Math.floor(worldCenter.z / 32),
                Boolean(object.geometry.index), attributes].join('|');
            if (!batches.has(key)) batches.set(key, []);
            batches.get(key).push(object);
        });
        let batchedSourceMeshes = 0, batchCount = 0;
        const retiredGeometries = new Set();
        for (const objects of batches.values()) {
            if (objects.length < 2) continue;
            const parts = objects.map(object => object.geometry.clone().applyMatrix4(object.matrixWorld));
            const geometry = mergeGeometries(parts, false);
            parts.forEach(part => part.dispose());
            if (!geometry) continue;
            geometry.computeBoundingSphere();
            geometry.computeBoundingBox();
            const first = objects[0];
            const mesh = new THREE.Mesh(geometry, first.material);
            mesh.name = `Static architectural batch ${batchCount + 1}`;
            mesh.castShadow = first.castShadow;
            mesh.receiveShadow = first.receiveShadow;
            mesh.renderOrder = first.renderOrder;
            masterGroup.add(mesh);
            for (const object of objects) {
                retiredGeometries.add(object.geometry);
                object.removeFromParent();
            }
            batchedSourceMeshes += objects.length;
            batchCount++;
        }
        const liveGeometries = new Set();
        masterGroup.updateMatrixWorld(true);
        masterGroup.traverse(object => {
            if (object.geometry) liveGeometries.add(object.geometry);
            if (!animatedRoots.has(object)) object.matrixAutoUpdate = false;
            if (!dynamicObjects.has(object)) object.matrixWorldAutoUpdate = false;
        });
        retiredGeometries.forEach(geometry => { if (!liveGeometries.has(geometry)) geometry.dispose(); });
        const geometryAfter = countSceneGeometry();
        const batchingStats = { before: geometryBefore, after: geometryAfter, batchedSourceMeshes, batches: batchCount,
            milliseconds: Math.round(performance.now() - batchStarted) };
        if (geometryBefore.triangles !== geometryAfter.triangles || geometryBefore.instances !== geometryAfter.instances) {
            throw new Error('Architectural batching changed scene geometry.');
        }
        instKoiRed.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        instKoiGold.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        // Fish leave their first-frame positions, so use their full swimming envelope.
        for (const fish of [instKoiRed, instKoiGold]) {
            fish.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 200);
        }
        animatedBanners.forEach(item => item.mesh.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage));

        // ==========================================
        // 15. 灯光系统、展陈 UI 交互与平滑运镜绑定
        // ==========================================
        const hemiLight = new THREE.HemisphereLight(0xffcf96, 0x222836, 0.75);
        scene.add(hemiLight);

        const sunLight = new THREE.DirectionalLight(0xff9d42, 2.8);
        sunLight.position.set(130, 95, 110);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.set(2048, 2048);
        sunLight.shadow.camera.near = 10;
        sunLight.shadow.camera.far = 450;
        const dCam = 175;
        sunLight.shadow.camera.left = -dCam; sunLight.shadow.camera.right = dCam;
        sunLight.shadow.camera.top = dCam; sunLight.shadow.camera.bottom = -dCam;
        sunLight.shadow.bias = -0.0005;
        scene.add(sunLight);

        const plazaWarmLight = new THREE.PointLight(0xff8822, 8.0, 95, 1.4);
        plazaWarmLight.position.set(0, 12.0, 65.0);
        const hallWarmLight = new THREE.PointLight(0xff8822, 10.0, 110, 1.4);
        hallWarmLight.position.set(0, 26.0, -18.0);
        const gateWarmLight = new THREE.PointLight(0xff9933, 9.0, 65, 1.3);
        gateWarmLight.position.set(0, 9.0, 174.0);
        scene.add(plazaWarmLight, hallWarmLight, gateWarmLight);

        function setLightingPreset(mode) {
            ['btn-sunset', 'btn-noon', 'btn-night'].forEach(id => document.getElementById(id).classList.remove('active'));
            if (mode === 'sunset') {
                document.getElementById('btn-sunset').classList.add('active');
                skyDomeMat.map = skyTextures.sunset;
                scene.fog.color.setHex(0x28181f);
                hemiLight.color.setHex(0xffcf96); hemiLight.groundColor.setHex(0x222836); hemiLight.intensity = 0.75;
                sunLight.color.setHex(0xff9838); sunLight.intensity = 2.8; sunLight.position.set(130, 85, 110);
                matWindowGlow.emissiveIntensity = 0.75; matFireGlow.emissiveIntensity = 1.8;
                matMagnetite.emissiveIntensity = 0.35; matMagneticVein.emissiveIntensity = 1.1;
                plazaWarmLight.intensity = 8.0; hallWarmLight.intensity = 10.0; gateWarmLight.intensity = 9.0;
                bloomPass.strength = 0.25;
                renderer.toneMappingExposure = 1.12;
            } else if (mode === 'noon') {
                document.getElementById('btn-noon').classList.add('active');
                skyDomeMat.map = skyTextures.noon;
                scene.fog.color.setHex(0x94badc);
                hemiLight.color.setHex(0xffffff); hemiLight.groundColor.setHex(0x4a525a); hemiLight.intensity = 1.0;
                sunLight.color.setHex(0xfffbf0); sunLight.intensity = 3.0; sunLight.position.set(90, 160, 120);
                matWindowGlow.emissiveIntensity = 0.15; matFireGlow.emissiveIntensity = 0.5;
                matMagnetite.emissiveIntensity = 0.15; matMagneticVein.emissiveIntensity = 0.6;
                plazaWarmLight.intensity = 1.5; hallWarmLight.intensity = 2.0; gateWarmLight.intensity = 3.0;
                bloomPass.strength = 0.14;
                renderer.toneMappingExposure = 1.15;
            } else if (mode === 'night') {
                document.getElementById('btn-night').classList.add('active');
                skyDomeMat.map = skyTextures.night;
                scene.fog.color.setHex(0x090e1c);
                hemiLight.color.setHex(0x4a6ea8); hemiLight.groundColor.setHex(0x101522); hemiLight.intensity = 0.58;
                sunLight.color.setHex(0x789cd8); sunLight.intensity = 0.72; sunLight.position.set(-90, 130, -70);
                matWindowGlow.emissiveIntensity = 0.90; matFireGlow.emissiveIntensity = 1.4;
                matMagnetite.emissiveIntensity = 0.45; matMagneticVein.emissiveIntensity = 1.4;
                plazaWarmLight.intensity = 4.2; hallWarmLight.intensity = 5.0; gateWarmLight.intensity = 6.0;
                bloomPass.strength = 0.19;
                renderer.toneMappingExposure = 1.02;
            }
            skyDomeMat.needsUpdate = true;
            renderer.shadowMap.needsUpdate = true;
            ['btn-sunset', 'btn-noon', 'btn-night'].forEach(id => {
                const button = document.getElementById(id);
                button.setAttribute('aria-pressed', String(button.classList.contains('active')));
            });
        }

        document.getElementById('btn-sunset').onclick = () => setLightingPreset('sunset');
        document.getElementById('btn-noon').onclick   = () => setLightingPreset('noon');
        document.getElementById('btn-night').onclick  = () => setLightingPreset('night');

        const SCENIC_PRESETS = {
            'overview':   [142, 78, 192,   0, 12, 10],
            'front':      [38, 22, 48,     0, 20, -22],
            'colossi':    [0, 7.5, 86,     0, 11, 20],
            'water-west': [-56, 6.8, 62,  -78, 4.2, 22],
            'water-east': [56, 7.2, 24,    84, 5.0, 42],
            'stargaze':   [55, 28, -52,    0, 20, -125],
            'magnet':     [0, 11, 195,     0, 9.5, 160],
            'zhongnan':   [0, 38, -55,     0, 22, 260]
        };

        function setScenicPreset(id, instant = false) {
            const pose = SCENIC_PRESETS[id];
            if (!pose) return;
            stopAutoModesOnUserAction();
            document.querySelectorAll('.scenic-btn').forEach(button => {
                const active = button.dataset.cam === id;
                button.classList.toggle('active', active);
                button.setAttribute('aria-pressed', String(active));
            });
            flyToCameraPose(...pose, instant);
        }
        document.querySelectorAll('.scenic-btn').forEach(btn => {
            btn.onclick = () => {
                setScenicPreset(btn.dataset.cam);
            };
        });

        document.getElementById('btn-rotate').onclick = (e) => {
            autoOrbit = !autoOrbit;
            camTransition.active = false;
            e.target.classList.toggle('active', autoOrbit);
            e.target.setAttribute('aria-pressed', String(autoOrbit));
        };

        document.getElementById('btn-toggle-ui').onclick = (e) => {
            const hidden = document.body.classList.toggle('ui-hidden');
            e.target.classList.toggle('active', hidden);
            e.target.setAttribute('aria-pressed', String(hidden));
            window.dispatchEvent(new CustomEvent('afang:immersion', { detail: { hidden } }));
        };

        document.getElementById('btn-export-obj').onclick = async (e) => {
            const button = e.currentTarget;
            button.disabled = true;
            window.dispatchEvent(new CustomEvent('afang:export', { detail: { busy: true } }));
            try {
                await new Promise(resolve => requestAnimationFrame(resolve));
                const { OBJExporter } = await import('three/addons/exporters/OBJExporter.js');
                const exporter = new OBJExporter();
                const result = exporter.parse(masterGroup);
                const blob = new Blob([result], { type: 'text/plain' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.download = 'qin_epang_palace_exhibition.obj';
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 30000);
                window.dispatchEvent(new CustomEvent('afang:export', { detail: { busy: false } }));
            } catch (error) {
                window.dispatchEvent(new CustomEvent('afang:export', { detail: { busy: false, error: String(error) } }));
            } finally {
                button.disabled = false;
            }
        };

        // ==========================================
        // 16. 动画主循环
        // ==========================================
        const forwardVec = new THREE.Vector3();
        const rightVec = new THREE.Vector3();
        let frameHandle = 0, lastFrameAt = 0, lastShadowAt = -Infinity, elapsed = 0;
        let renderedFrames = 0, firstFrameAt = 0, lastRenderMs = 0, contextLost = false;
        const recentFrameTimes = [];
        window.AfangPalace = {
            ready: false, renderer, scene, camera,
            setQuality, setMove, setScenicPreset, setLightingPreset,
            getQuality: () => ({ quality: qualityChoice, effectiveQuality }),
            getStats: () => ({
                ready: window.AfangPalace.ready, quality: qualityChoice, effectiveQuality,
                geometry: batchingStats, frames: renderedFrames, visible: !document.hidden,
                elapsed, lastRenderMs: +lastRenderMs.toFixed(2),
                recentFrameMs: recentFrameTimes.length ? +(recentFrameTimes.reduce((sum, value) => sum + value, 0) / recentFrameTimes.length).toFixed(2) : 0,
                startupMs: firstFrameAt ? Math.round(firstFrameAt - bootStarted) : null,
                drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
                memory: { ...renderer.info.memory }, pixelRatio: renderer.getPixelRatio(),
                drawingBuffer: [renderer.domElement.width, renderer.domElement.height],
                animationCounts: { banners: animatedBanners.length, barges: animatedBarges.length, fires: fireBraziers.length, koi: koiSwimmers.length }
            })
        };

        function animate(timestamp) {
            frameHandle = 0;
            if (document.hidden || contextLost) return;
            frameHandle = requestAnimationFrame(animate);
            const profile = qualityProfiles[effectiveQuality];
            const frameMs = lastFrameAt ? timestamp - lastFrameAt : 0;
            if (lastFrameAt && frameMs < 1000 / profile.fps - 1) return;
            const delta = Math.min(frameMs / 1000, 0.1);
            elapsed += delta;
            lastFrameAt = timestamp;
            if (frameMs) {
                recentFrameTimes.push(frameMs);
                if (recentFrameTimes.length > 60) recentFrameTimes.shift();
            }
            if (timestamp - lastShadowAt >= 1000 / profile.shadowHz) {
                renderer.shadowMap.needsUpdate = true;
                lastShadowAt = timestamp;
            }

            if (camTransition.active) {
                camTransition.progress += delta / camTransition.duration;
                if (camTransition.progress >= 1.0) {
                    camTransition.progress = 1.0;
                    camTransition.active = false;
                }
                const t = camTransition.progress;
                const ease = t * t * t * (t * (t * 6 - 15) + 10);
                camera.position.lerpVectors(camTransition.startPos, camTransition.endPos, ease);
                camera.quaternion.slerpQuaternions(camTransition.startQuat, camTransition.endQuat, ease);
                camEuler.setFromQuaternion(camera.quaternion);
            } else if (autoOrbit) {
                orbitAngle += delta * 0.16;
                const dist = Math.hypot(camera.position.x - orbitCenter.x, camera.position.z - orbitCenter.z);
                camera.position.x = orbitCenter.x + Math.sin(orbitAngle) * dist;
                camera.position.z = orbitCenter.z + Math.cos(orbitAngle) * dist;
                applyAirWallConstraints();
                camera.lookAt(orbitCenter);
                camEuler.setFromQuaternion(camera.quaternion);
            } else {
                const speed = (moveState.sprint ? 75.0 : 32.0) * delta;
                camera.getWorldDirection(forwardVec);
                forwardVec.y = 0;
                if (forwardVec.lengthSq() > 0.0001) forwardVec.normalize();
                rightVec.crossVectors(forwardVec, camera.up).normalize();

                if (moveState.forward)  camera.position.addScaledVector(forwardVec, speed);
                if (moveState.backward) camera.position.addScaledVector(forwardVec, -speed);
                if (moveState.right)    camera.position.addScaledVector(rightVec, speed);
                if (moveState.left)     camera.position.addScaledVector(rightVec, -speed);
                if (moveState.up)       camera.position.y += speed * 0.75;
                if (moveState.down)     camera.position.y -= speed * 0.75;

                applyAirWallConstraints();
            }

            skyDome.position.copy(camera.position);

            // 1) 池塘 60 尾锦鲤实时游弋更新
            koiSwimmers.forEach(k => {
                const t = elapsed * k.speed + k.phase;
                const nx = k.cx + Math.cos(t) * k.rx;
                const nz = k.cz + Math.sin(t * 2) * k.rz * 0.55;
                const dx = -Math.sin(t) * k.rx;
                const dz = Math.cos(t * 2) * k.rz * 1.1;
                dummy.position.set(nx, 0.09, nz);
                dummy.rotation.set(0, Math.atan2(dx, dz) + Math.sin(elapsed * 9.0 + k.phase) * 0.12, 0);
                dummy.scale.set(1, 1, 1);
                dummy.updateMatrix();
                if (k.isRed) instKoiRed.setMatrixAt(k.idx, dummy.matrix);
                else instKoiGold.setMatrixAt(k.idx, dummy.matrix);
            });
            instKoiRed.instanceMatrix.needsUpdate = true;
            instKoiGold.instanceMatrix.needsUpdate = true;

            // 2) 五丈旗迎风飘扬
            animatedBanners.forEach(b => {
                const posAttr = b.mesh.geometry.attributes.position;
                const arr = posAttr.array;
                const base = b.basePos;
                for (let i = 0; i < arr.length; i += 3) {
                    const bx = base[i], by = base[i + 1];
                    const distFromPole = Math.abs(bx + 1.2) / 2.4;
                    arr[i + 2] = Math.sin(elapsed * 4.5 + bx * 2.0 + by * 0.8 + b.phase) * 0.32 * distFromPole;
                }
                posAttr.needsUpdate = true;
            });

            // 3) 皇家画舫楼船平稳巡航
            animatedBarges.forEach(bg => {
                const offset = Math.sin(elapsed * bg.speed + bg.phase) * bg.r;
                if (bg.axis === 'z') bg.mesh.position.z = bg.cz + offset;
                else bg.mesh.position.x = bg.cx + offset;
                bg.mesh.position.y = 0.12 + Math.sin(elapsed * 2.0 + bg.phase) * 0.025;
            });

            // 4) 庭燎火盆跳动
            fireBraziers.forEach((f, idx) => {
                const s = 1.0 + Math.sin(elapsed * 8.5 + idx * 1.7) * 0.14;
                f.scale.set(1, s, 1);
            });

            const renderStarted = performance.now();
            renderer.info.reset();
            composer.render();
            lastRenderMs = performance.now() - renderStarted;
            renderedFrames++;
            if (!window.AfangPalace.ready) {
                firstFrameAt = performance.now();
                window.AfangPalace.ready = true;
                reportProgress('render', 1);
                window.dispatchEvent(new CustomEvent('afang:ready', { detail: window.AfangPalace.getStats() }));
            }
            // Automatic mode only steps down after a sustained slow interval.
            // All architectural geometry and all animations remain present.
            if (qualityChoice === 'auto' && renderedFrames % 180 === 0 && recentFrameTimes.length === 60) {
                const average = recentFrameTimes.reduce((sum, value) => sum + value, 0) / recentFrameTimes.length;
                if ((effectiveQuality === 'high' && average > 38) || (effectiveQuality === 'balanced' && average > 55)) {
                    effectiveQuality = effectiveQuality === 'high' ? 'balanced' : 'low';
                    resizeRendering();
                    recentFrameTimes.length = 0;
                    window.dispatchEvent(new CustomEvent('afang:qualitychange', { detail: { quality: qualityChoice, effectiveQuality } }));
                }
            }
        }
        document.addEventListener('visibilitychange', () => {
            releaseMovement();
            if (document.hidden) {
                cancelAnimationFrame(frameHandle);
                frameHandle = 0;
            } else if (!contextLost && !frameHandle) {
                lastFrameAt = 0;
                frameHandle = requestAnimationFrame(animate);
            }
        });
        dom.addEventListener('webglcontextlost', event => {
            event.preventDefault();
            contextLost = true;
            cancelAnimationFrame(frameHandle);
            frameHandle = 0;
            releaseMovement();
            window.dispatchEvent(new CustomEvent('afang:error', { detail: { stage: 'webgl', message: 'Graphics context lost' } }));
        });
        dom.addEventListener('webglcontextrestored', () => {
            contextLost = false;
            renderer.shadowMap.needsUpdate = true;
            lastFrameAt = 0;
            if (!document.hidden && !frameHandle) frameHandle = requestAnimationFrame(animate);
            window.dispatchEvent(new CustomEvent('afang:restored'));
        });
        let resizeHandle = 0;
        window.addEventListener('resize', () => {
            cancelAnimationFrame(resizeHandle);
            resizeHandle = requestAnimationFrame(resizeRendering);
        });
        reportProgress('compile', 0.7);
        await new Promise(resolve => requestAnimationFrame(resolve));
        frameHandle = requestAnimationFrame(animate);
    
