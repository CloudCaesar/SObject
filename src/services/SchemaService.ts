import { PermissionQueryService } from './PermissionQueryService';

export class SchemaService {
    private queryService: PermissionQueryService;

    constructor() {
        this.queryService = new PermissionQueryService();
    }

    async initialize(): Promise<void> {
        await this.queryService.initialize();
    }

    async getQueryableSObjects() {
        return await this.queryService.getEntityDefinitionSelector().selectQueryableSObjects();
    }
}