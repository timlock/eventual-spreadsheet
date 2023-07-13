import {Address} from "../domain/Address";

export class GraphSorter {
  private sortedVertices: Address[][] = [];
  private vertices: Map<string, Vertices> = new Map();

  public addCell(cell: [Address, Address[]]) {
    this.vertices.set(cell[0].toString(),
      {
        address: cell[0],
        neighbours: cell[1],
        visited: false,
        discovered: false,
        cyclical: false
      }
    );
  }

  public sort(): Address[][] {
    let undiscovered = Array.from(this.vertices.values());
    while (undiscovered.length > 0) {
      let current = undiscovered.pop()!;
      this.visit(current);
    }
    return this.sortedVertices;
  }

  private visit(vertices: Vertices) {
    if (vertices.discovered) {
      return;
    }
    if (vertices.visited) {
      vertices.cyclical = true;
      return;
      // throw Error("Cycle detected");
    }
    vertices.visited = true;
    for (const address of vertices.neighbours) {
      let neighbour = this.vertices.get(address.toString());
      if(neighbour != undefined){
        this.visit(neighbour);
      }
    }
    vertices.discovered = true;
    let currentComponent = this.sortedVertices.pop() ||[];
    currentComponent.push(vertices.address);
    this.sortedVertices.push(currentComponent);
    // let currentComponent = this.sortedVertices.shift() || [];
    // currentComponent.splice(0, 0, vertices.address);
    // this.sortedVertices.splice(0, 0, currentComponent);
  }
}

interface Vertices {
  address: Address;
  neighbours: Address[];
  visited: boolean;
  discovered: boolean;
  cyclical: boolean;

}
