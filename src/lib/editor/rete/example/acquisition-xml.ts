import type { EditorExample } from "./types";
import type { NodeFactory } from "$rete/node/NodeFactory";

// interface XmlExample {
// 	(editor: NodeEditor): Promise<Node[]>;
// }

export const acquisitionXmlExample: EditorExample = async (
  factory: NodeFactory,
) => {
  const editor = factory.getEditor();
  // const problem = new ProblemNode({ factory });
  // await editor.addNode(problem);

  // const vtkOutput = new VtkOutputNode({ factory });
  // await editor.addNode(vtkOutput);
  // await editor.addNewConnection(vtkOutput, 'value', problem, 'outputs');

  // const fieldSpecification1 = new FieldSpecificationNode({
  // 	factory,

  // 	initialValues: {
  // 		scale: 0.0,
  // 		objectPath: 'nodeManager',
  // 		fieldName: 'pressure_n',
  // 		initialCondition: true
  // 	}
  // });
  // await editor.addNode(fieldSpecification1);
  // const fieldSpecification2 = new FieldSpecificationNode({
  // 	factory,
  // 	initialValues: {
  // 		scale: 0.0,
  // 		objectPath: 'nodeManager',
  // 		fieldName: 'pressure_nm1',
  // 		initialCondition: true
  // 	}
  // });

  // await editor.addNode(fieldSpecification2);
  // const fieldSpecification3 = new FieldSpecificationNode({
  // 	factory,
  // 	initialValues: {
  // 		scale: 0.0,
  // 		objectPath: 'faceManager',
  // 		fieldName: 'FreeSurface'
  // 	}
  // });
  // await editor.addNode(fieldSpecification3);

  // const fieldSpecificationsArray = new MakeArrayNode({ factory });
  // await editor.addNode(fieldSpecificationsArray);
  // fieldSpecificationsArray.addPin();
  // fieldSpecificationsArray.addPin();

  // await editor.addNewConnection(fieldSpecification1, 'value', fieldSpecificationsArray, 'data-0');
  // await editor.addNewConnection(fieldSpecification2, 'value', fieldSpecificationsArray, 'data-1');
  // await editor.addNewConnection(fieldSpecification3, 'value', fieldSpecificationsArray, 'data-2');
  // await editor.addNewConnection(fieldSpecificationsArray, 'array', problem, 'fieldSpecifications');

  // const fieldSpecification1SetNamesArray = new MakeArrayNode({
  // 	factory,
  // 	initialValues: { 'data-0': 'all' }
  // });
  // await editor.addNode(fieldSpecification1SetNamesArray);
  // await editor.addNewConnection(
  // 	fieldSpecification1SetNamesArray,
  // 	'array',
  // 	fieldSpecification1,
  // 	'setNames'
  // );

  // await editor.addNewConnection(fieldSpecificationsArray, 'array', problem, 'fieldSpecifications');

  // const fieldSpecification2SetNamesArray = new MakeArrayNode({
  // 	factory,
  // 	initialValues: {
  // 		'data-0': 'all'
  // 	}
  // });
  // await editor.addNode(fieldSpecification2SetNamesArray);
  // await editor.addNewConnection(
  // 	fieldSpecification2SetNamesArray,
  // 	'array',
  // 	fieldSpecification2,
  // 	'setNames'
  // );

  // const fieldSpecification3SetNamesArray = new MakeArrayNode({ factory });
  // await editor.addNode(fieldSpecification3SetNamesArray);
  // await editor.addNewConnection(
  // 	fieldSpecification3SetNamesArray,
  // 	'array',
  // 	fieldSpecification3,
  // 	'setNames'
  // );

  // // Geometry
  // // const geometryArray = new MakeArrayNode({ factory });
  // // await editor.addNode(geometryArray);
  // const box = new BoxXmlNode({
  // 	factory,
  // 	initialValues: {
  // 		xMin: { x: -0.01, y: -0.01, z: 499.99 },
  // 		xMax: { x: 500.01, y: 500.01, z: 500.01 }
  // 	}
  // });
  // await editor.addNode(box);
  // await editor.addNewConnection(box, 'value', problem, 'geometry');

  // const getBoxName = new GetNameNode({ factory });
  // await editor.addNode(getBoxName);
  // await editor.addNewConnection(box, 'value', getBoxName, 'xml');

  // await editor.addNewConnection(getBoxName, 'name', fieldSpecification3SetNamesArray, 'data-0');

  // const download = new DownloadNode({ factory });
  // await editor.addNode(download);
  // await editor.addNewConnection(problem, 'value', download, 'data');

  // //             < AcousticSEM
  // //   name="acousticSolver"
  // //   cflFactor="0.25"
  // //   discretization="FE1"
  // //   targetRegions="{ Region }"
  // //   sourceCoordinates="{ { 1005.0, 1005.0, 1005.0 } }"
  // //   timeSourceFrequency="2.0"
  // //   receiverCoordinates="{ { 1105,1005, 1005 } }"
  // //   outputSeismoTrace="0"
  // //   dtSeismoTrace="0.005" />

  // const acousticSEM = new AcousticSEMNode({
  // 	factory,
  // 	initialValues: {
  // 		cflFactor: 0.25,
  // 		// discretization: 'FE1',
  // 		// targetRegions: '{ Region }',
  // 		// sourceCoordinates: '{ { 1005.0, 1005.0, 1005.0 } }',
  // 		timeSourceFrequency: 2.0,
  // 		// receiverCoordinates: '{ { 1105,1005, 1005 } }',
  // 		outputSeismoTrace: false,
  // 		dtSeismoTrace: 0.005
  // 	}
  // });
  // await editor.addNode(acousticSEM);

  // // const solverTargetRegionsArray = new MakeArrayNode({ factory, initialValues: { 'data-0': 'Region' } });
  // // await editor.addNode(solverTargetRegionsArray);
  // // await editor.addNewConnection(solverTargetRegionsArray, 'array', acousticSEM, 'targetRegions');

  // const solverReceiverCoordinatesArray = new MakeArrayNode({
  // 	factory,
  // 	initialValues: { 'data-0': { x: 1105.0, y: 1005.0, z: 1005.0 } }
  // });
  // await editor.addNode(solverReceiverCoordinatesArray);
  // await editor.addNewConnection(
  // 	solverReceiverCoordinatesArray,
  // 	'array',
  // 	acousticSEM,
  // 	'receiverCoordinates'
  // );

  // await editor.addNewConnection(acousticSEM, 'value', problem, 'solvers');

  // const solverSourceCoordinatesArray = new MakeArrayNode({
  // 	factory,
  // 	initialValues: { 'data-0': { x: 1005.0, y: 1005.0, z: 1005.0 } }
  // });
  // await editor.addNode(solverSourceCoordinatesArray);
  // await editor.addNewConnection(
  // 	solverSourceCoordinatesArray,
  // 	'array',
  // 	acousticSEM,
  // 	'sourceCoordinates'
  // );

  // const vtkMesh = new VTKMeshNode({
  // 	factory,
  // 	initialValues: {
  // 		file: '../models/bicouche50x50x50.vtu'
  // 	}
  // });
  // await editor.addNode(vtkMesh);

  // const vtkMeshFieldsToImportArray = new MakeArrayNode({
  // 	factory,
  // 	initialValues: { 'data-0': 'mediumVelocity' }
  // });
  // await editor.addNode(vtkMeshFieldsToImportArray);
  // await editor.addNewConnection(vtkMeshFieldsToImportArray, 'array', vtkMesh, 'fieldsToImport');

  // const vtkMeshFieldNamesInGEOSXArray = new MakeArrayNode({
  // 	factory,
  // 	initialValues: { 'data-0': 'mediumVelocity' }
  // });
  // await editor.addNode(vtkMeshFieldNamesInGEOSXArray);
  // await editor.addNewConnection(
  // 	vtkMeshFieldNamesInGEOSXArray,
  // 	'array',
  // 	vtkMesh,
  // 	'fieldNamesInGEOSX'
  // );

  // await editor.addNewConnection(vtkMesh, 'value', problem, 'mesh');

  // const finiteElements = new FiniteElementsNode({ factory });
  // await editor.addNode(finiteElements);

  // // const numericalMethodsArray = new MakeArrayNode({ factory });
  // // await editor.addNode(numericalMethodsArray);

  // await editor.addNewConnection(finiteElements, 'value', problem, 'numericalMethods');
  // // await editor.addNewConnection(numericalMethodsArray, 'array', problem, 'numericalMethods');

  // const finiteElementSpace = new FiniteElementSpaceNode({
  // 	factory,
  // 	initialValues: {
  // 		order: 1,
  // 		formulation: 'SEM'
  // 	}
  // });
  // await editor.addNode(finiteElementSpace);

  // await editor.addNewConnection(finiteElementSpace, 'value', finiteElements, 'finiteElements');

  // //     <CellElementRegion
  // //       name="Region"
  // // cellBlocks = "{ hexahedra }"
  // // materialList = "{ nullModel }" />

  // const cellElementRegion = new CellElementRegionNode({ factory });
  // await editor.addNode(cellElementRegion);

  // const cellElementRegionCellBlocksArray = new MakeArrayNode({
  // 	factory,
  // 	initialValues: { 'data-0': 'hexahedra' }
  // });
  // await editor.addNode(cellElementRegionCellBlocksArray);
  // await editor.addNewConnection(
  // 	cellElementRegionCellBlocksArray,
  // 	'array',
  // 	cellElementRegion,
  // 	'cellBlocks'
  // );

  // const cellElementRegionMaterialListArray = new MakeArrayNode({ factory });
  // await editor.addNode(cellElementRegionMaterialListArray);
  // await editor.addNewConnection(
  // 	cellElementRegionMaterialListArray,
  // 	'array',
  // 	cellElementRegion,
  // 	'materialList'
  // );

  // await editor.addNewConnection(cellElementRegion, 'value', problem, 'elementRegions');

  // const nullModel = new NullModelNode({ factory });
  // await editor.addNode(nullModel);

  // await editor.addNewConnection(nullModel, 'value', problem, 'constitutive');

  // const nullModelName = new GetNameNode({ factory });
  // await editor.addNode(nullModelName);
  // await editor.addNewConnection(nullModel, 'value', nullModelName, 'xml');

  // await editor.addNewConnection(
  // 	nullModelName,
  // 	'name',
  // 	cellElementRegionMaterialListArray,
  // 	'data-0'
  // );

  // // solver connections
  // const regionName = new GetNameNode({ factory });
  // await editor.addNode(regionName);
  // await editor.addNewConnection(cellElementRegion, 'value', regionName, 'xml');

  // await editor.addNewConnection(regionName, 'name', acousticSEM, 'targetRegions');

  // const finiteElementSpaceName = new GetNameNode({ factory });
  // await editor.addNode(finiteElementSpaceName);

  // await editor.addNewConnection(finiteElementSpace, 'value', finiteElementSpaceName, 'xml');
  // await editor.addNewConnection(finiteElementSpaceName, 'name', acousticSEM, 'discretization');
  // await editor.addNewConnection('discre/', acousticSEM, 'problem');

  return editor.getNodes();
};
