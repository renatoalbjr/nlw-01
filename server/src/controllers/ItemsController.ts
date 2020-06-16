import knex from '../database/connection';
import { Request, Response, response } from 'express';

class ItemsController {
    async index(req: Request, res: Response) {
        const items = await knex('items').select('*');
        
        //const access='localhost';
        const access='192.168.1.11';
        
        const serializedItems = items.map(item => {
            return {
                id: item.id,
                title: item.title,
                image_url: `http://${access}:3333/uploads/${item.image}`
            };
        });
        res.json(serializedItems);
    }
}

export default ItemsController;
