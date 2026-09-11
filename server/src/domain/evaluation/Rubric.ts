export class Rubric {
  private id: string;
  private name: string;
  private criteria: { category: string; description: string; maxScore: number }[];
  constructor(data: { id: string; name: string; criteria: any[] }) {
    this.id = data.id;
    this.name = data.name;
    this.criteria = data.criteria;
  }
  public getCriteria() { return this.criteria; }
}