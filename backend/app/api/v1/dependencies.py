from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.application.use_cases.list_orders import ListOrdersUseCase
from app.application.use_cases.update_order import UpdateOrderUseCase
from app.application.use_cases.create_order import CreateOrderUseCase
from app.core.database import get_database
from app.infrastructure.repositories.mongo_order_repository import MongoOrderRepository
from app.infrastructure.repositories.mongo_restaurant_repository import MongoRestaurantRepository
from app.infrastructure.repositories.mongo_rider_repository import MongoRiderRepository
from app.application.interfaces.rider_adjustment_repository import RiderAdjustmentRepository
from app.application.use_cases.create_rider_adjustment import CreateRiderAdjustmentUseCase
from app.application.use_cases.get_rider_summaries import GetRiderSummariesUseCase
from app.infrastructure.repositories.mongo_rider_adjustment_repository import MongoRiderAdjustmentRepository
from app.infrastructure.repositories.mongo_expense_repository import MongoExpenseRepository




def get_restaurant_repository(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> MongoRestaurantRepository:
    return MongoRestaurantRepository(db)


def get_rider_repository(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> MongoRiderRepository:
    return MongoRiderRepository(db)


def get_order_repository(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> MongoOrderRepository:
    return MongoOrderRepository(db)


def get_create_order_use_case(
    order_repo: MongoOrderRepository = Depends(get_order_repository),
    restaurant_repo: MongoRestaurantRepository = Depends(get_restaurant_repository),
    rider_repo: MongoRiderRepository = Depends(get_rider_repository),
) -> CreateOrderUseCase:
    return CreateOrderUseCase(order_repo, restaurant_repo, rider_repo)

def get_rider_adjustment_repository(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> MongoRiderAdjustmentRepository:
    return MongoRiderAdjustmentRepository(db)


def get_create_rider_adjustment_use_case(
    rider_repo: MongoRiderRepository = Depends(get_rider_repository),
    adjustment_repo: MongoRiderAdjustmentRepository = Depends(get_rider_adjustment_repository),
) -> CreateRiderAdjustmentUseCase:
    return CreateRiderAdjustmentUseCase(rider_repo, adjustment_repo)


def get_rider_summaries_use_case(
    rider_repo: MongoRiderRepository = Depends(get_rider_repository),
    order_repo: MongoOrderRepository = Depends(get_order_repository),
    adjustment_repo: MongoRiderAdjustmentRepository = Depends(get_rider_adjustment_repository),
) -> GetRiderSummariesUseCase:
    return GetRiderSummariesUseCase(rider_repo, order_repo, adjustment_repo)

def get_list_orders_use_case(
    order_repo: MongoOrderRepository = Depends(get_order_repository),
) -> ListOrdersUseCase:
    return ListOrdersUseCase(order_repo)


def get_update_order_use_case(
    order_repo: MongoOrderRepository = Depends(get_order_repository),
) -> UpdateOrderUseCase:
    return UpdateOrderUseCase(order_repo)


def get_expense_repository(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> MongoExpenseRepository:
    return MongoExpenseRepository(db)