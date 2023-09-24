import {Address} from "../domain/Address";

export class GraphSorter {
  private sortedVertices: Address[][] = [];
  private vertices: Map<string, Vertices> = new Map();

  public addCell(cell: [Address, Address[]]) {
    this.vertices.set(cell[0].column + '|' + cell[0].row,
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
    const undiscovered = Array.from(this.vertices.values());
    while (undiscovered.length > 0) {
      const current = undiscovered.pop()!;
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
    }
    vertices.visited = true;
    for (const address of vertices.neighbours) {
      const neighbour = this.vertices.get(address.column + '|' + address.row);
      if(neighbour != undefined){
        this.visit(neighbour);
      }
    }
    vertices.discovered = true;
    const currentComponent = this.sortedVertices.pop() ||[];
    currentComponent.push(vertices.address);
    this.sortedVertices.push(currentComponent);
  }
}

interface Vertices {
  address: Address;
  neighbours: Address[];
  visited: boolean;
  discovered: boolean;
  cyclical: boolean;

}
