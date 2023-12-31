import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as CANNON from "cannon-es";

export default function () {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
  });
  renderer.setClearColor(0x333333, 1);
  renderer.shadowMap.enabled = true;
  // PCFSoftShadowMap : 그림자를 조금 더 부드럽게 만들 수 있게
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const container = document.querySelector("#container");

  container.appendChild(renderer.domElement);

  const canvasSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    canvasSize.width / canvasSize.height,
    0.1,
    100
  );
  camera.position.set(5, 7, 5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  const createLight = () => {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.castShadow = true;
    light.position.set(0, 10, 0);

    scene.add(light);
  };

  const world = new CANNON.World();
  world.broadphase = new CANNON.SAPBroadphase(world);
  world.gravity.set(0, -9.82, 0);
  world.allowSleep = true;
  const worldObjects = [];

  const floorMaterial = new CANNON.Material("floor");
  const sphereMaterial = new CANNON.Material("sphere");
  //두개의 material을 인자로 받는다
  const contactMaterial = new CANNON.ContactMaterial(
    floorMaterial,
    sphereMaterial,
    {
      friction: 0.1,
      restitution: 0.5,
    }
  );
  world.addContactMaterial(contactMaterial);

  const createFloor = () => {
    const geometry = new THREE.BoxGeometry(6, 1, 6);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    scene.add(mesh);

    //geometry에서 설정한 width, height, depth를 2로 나눈 값으로 설정
    // 이렇게 해야  width, height, depth 각각 중심에서 모양을 만들 수 있도록 CANNONjs에서 그림을 그려줌
    const shape = new CANNON.Box(new CANNON.Vec3(6 / 2, 1 / 2, 6 / 2));
    //해당 물체의 마찰력과 탄성의 정도를 설정할 수 있게 해줌

    //질량을 가진 하나의 핵심적인 핵을 만드는 것
    // mass : 질량 , 0이면 물체가 움직이지 않음
    const body = new CANNON.Body({ shape, material: floorMaterial, mass: 0 });
    //물리공간에 물체 추가
    world.addBody(body);
    worldObjects.push({ mesh, body });
  };

  const createSphere = () => {
    const material = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
    const geometry = new THREE.SphereGeometry(0.3, 30, 30);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    scene.add(mesh);

    //물리공간에 sphere추가
    const shape = new CANNON.Sphere(0.3);

    const body = new CANNON.Body({
      shape,
      material: sphereMaterial,
      mass: 1,
    });
    body.position.y = 5;
    body.name = "sphere";

    world.addBody(body);

    worldObjects.push({ mesh, body });
  };

  const resize = () => {
    canvasSize.width = window.innerWidth;
    canvasSize.height = window.innerHeight;

    camera.aspect = canvasSize.width / canvasSize.height;
    camera.updateProjectionMatrix();

    renderer.setSize(canvasSize.width, canvasSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  const addEvent = () => {
    window.addEventListener("resize", resize);
  };

  const draw = () => {
    controls.update();
    renderer.render(scene, camera);
    // 60분의 1프레임마다 world에 있는 모든 물체에 상태 업데이트
    world.step(1 / 60);
    //world에 추가되어있는 box 물체의 위치와 threejs mesh로 만들었던 box의 위치를 draw내에서 동기화 시켜줘야 결과물 제대로 보임
    worldObjects.forEach(({ mesh, body }) => {
      if (body.name === "sphere") {
        //특정바디의 point에 힘을 가하는 함수
        // 파라미터  : 힘의 vector, 질량의 중심이되는 상대적인 point(body의 position)
        body.applyForce(new CANNON.Vec3(0, 0, 1), body.position);
      }
      mesh.position.copy(body.position);
      //회전값, rotation보다 더 정확한 단위라고함
      mesh.quaternion.copy(body.quaternion);
    });
    requestAnimationFrame(() => {
      draw();
    });
  };

  const initialize = () => {
    createLight();
    createFloor();
    createSphere();
    addEvent();
    resize();
    draw();
  };

  initialize();
}
